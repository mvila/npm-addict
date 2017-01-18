'use strict';

import assert from 'assert';
import koa from 'koa';
import convert from 'koa-convert';
import cors from 'koa-cors';
import Router from 'koa-router';
import pick from 'lodash/pick';
import ua from 'universal-analytics';
import RSS from 'rss';

export class Server {
  constructor(app, options = {}) {
    this.app = app;
    this.port = options.port;
  }

  start() {
    let app = this.app;

    let router = new Router({ prefix: '/v1' });

    async function createUAVisitor(ctx, next) {
      let visitor;

      if (app.environment === 'production') {
        let userId;
        if (ctx.query.clientId) userId = 'client-' + ctx.query.clientId;
        visitor = ua(
          app.googleAnalyticsTrackingId,
          userId,
          { strictCidFormat: false }
        );
      }

      ctx.sendUAEvent = function(category, action) {
        if (!visitor) return;
        let ip = ctx.request.ip;
        if (ip.startsWith('::ffff:')) ip = ip.substr(7);
        let language = ctx.headers['accept-language'];
        if (language) {
          let index = language.indexOf('-');
          if (index > 0) language = language.substr(0, index);
        }
        let options = {
          eventCategory: category,
          eventAction: action,
          ipOverride: ip,
          documentHostName: ctx.hostname,
          documentPath: ctx.path,
          userAgentOverride: ctx.headers['user-agent'],
          documentReferrer: ctx.headers['referer'],
          userLanguage: language
        };
        visitor.event(options, function(err) {
          if (err) {
            app.log.notice(`An error occured while sending an Universal Analytics event (${err.message})`);
          }
        });
      };

      await next();
    }

    router.use(createUAVisitor);

    // curl -v http://api.dev.npmaddict.com:20576/v1/health-check
    router.get('/health-check', async function(ctx) {
      let time = Date.now();
      let count = await app.store.Package.count();
      time = Date.now() - time;
      assert.ok(count > 0, 'There should be at least one package.');
      ctx.logLevel = 'silence';
      ctx.body = `OK (${time} ms)`;
    });

    router.get('/packages', async function(ctx) {
      let start = ctx.query.start;
      let startAfter = ctx.query.startAfter;
      let end = ctx.query.end;
      let endBefore = ctx.query.endBefore;
      let reverse = ctx.query.reverse === '1';
      let limit = Number(ctx.query.limit) || 100;
      if (limit > 300) {
        throw new Error('\'limit\' parameter cannot be greater than 300');
      }

      let options = {
        query: { revealed: true },
        order: 'revealedOn',
        reverse,
        limit
      };
      if (start) options.start = start;
      if (startAfter) options.startAfter = startAfter;
      if (end) options.end = end;
      if (endBefore) options.endBefore = endBefore;

      let packages = await app.store.Package.find(options);

      let results = packages.map(function(pkg) {
        return pick(pkg, [
          'id', 'name', 'description', 'npmURL', 'gitHubURL', 'revealedOn'
        ]);
      });

      ctx.body = results;

      ctx.sendUAEvent('backend', 'getNewPackages');
    });

    router.get('/feeds/daily', async function(ctx) {
      let posts = await app.store.Post.find({
        order: 'createdOn',
        reverse: true,
        limit: 30
      });

      let feed = new RSS({
        title: app.displayName + ' (daily feed)',
        description: app.description,
        feed_url: app.url + 'feeds/daily', // eslint-disable-line camelcase
        site_url: app.frontendURL // eslint-disable-line camelcase
      });

      for (let post of posts) {
        feed.item({
          title: post.title,
          description: post.content,
          url: post.url,
          date: post.createdOn,
          guid: post.id
        });
      }

      let xml = feed.xml({ indent: true });

      ctx.type = 'application/rss+xml; charset=utf-8';
      ctx.body = xml;

      ctx.sendUAEvent('backend', 'getDailyFeed');
    });

    router.get('/feeds/real-time', async function(ctx) {
      let packages = await app.store.Package.find({
        query: { revealed: true },
        order: 'revealedOn',
        reverse: true,
        limit: 100
      });

      let feed = new RSS({
        title: app.displayName + ' (real-time feed)',
        description: 'One post for every new npm package',
        feed_url: app.url + 'feeds/real-time', // eslint-disable-line camelcase
        site_url: app.frontendURL // eslint-disable-line camelcase
      });

      for (let pkg of packages) {
        feed.item({
          title: pkg.name,
          description: pkg.formattedDescription,
          url: pkg.bestURL,
          date: pkg.revealedOn,
          guid: pkg.id
        });
      }

      let xml = feed.xml({ indent: true });

      ctx.type = 'application/rss+xml; charset=utf-8';
      ctx.body = xml;

      ctx.sendUAEvent('backend', 'getRealTimeFeed');
    });

    // === Server initialization ===

    let root = new koa();
    root.name = app.name;
    root.proxy = true;
    root.use(convert(cors()));
    root.use(convert(app.log.getLoggerMiddleware()));
    root.use(router.routes());
    root.use(router.allowedMethods());

    root.listen(this.port, () => {
      app.log.info('Listening on port ' + this.port);
    });
  }
}

export default Server;
