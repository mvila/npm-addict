'use strict';

import koa from 'koa';
import cors from 'koa-cors';
import mount from 'koa-mount';
import koaRouter from 'koa-router';
import pick from 'lodash/pick';
import ua from 'universal-analytics';
import RSS from 'rss';

function start(app, options = {}) {
  let v1 = koa();
  v1.name = 'api';

  let router = koaRouter();
  v1.use(router.routes());
  v1.use(router.allowedMethods());

  function *createUAVisitor(next) {
    try {
      let trackingId = process.env.GOOGLE_ANALYTICS_TRACKING_ID;
      if (trackingId) {
        let userId;
        if (this.query.clientId) userId = 'client-' + this.query.clientId;
        this.visitor = ua(trackingId, userId, { strictCidFormat: false });
      }
    } catch (err) {
      app.log.notice(`An error occured while creating an Universal Analytics visitor (${err.message})`);
    }
    yield next;
  }

  function sendUAEvent(ctx, category, action) {
    if (!ctx.visitor) return;
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
    ctx.visitor.event(options, function(err) {
      if (err) {
        app.log.notice(`An error occured while sending an Universal Analytics event (${err.message})`);
      }
    });
  }

  router.get('/packages', createUAVisitor, function *() {
    let start = this.query.start;
    let startAfter = this.query.startAfter;
    let end = this.query.end;
    let endBefore = this.query.endBefore;
    let reverse = this.query.reverse === '1';
    let limit = Number(this.query.limit) || 100;
    if (limit > 300) {
      throw new Error('\'limit\' parameter cannot be greater than 300');
    }

    let options = {
      query: { visible: true },
      order: 'itemCreatedOn',
      reverse,
      limit
    };
    if (start) options.start = start;
    if (startAfter) options.startAfter = startAfter;
    if (end) options.end = end;
    if (endBefore) options.endBefore = endBefore;

    let packages = yield app.store.Package.find(options);

    let results = packages.map(function(pkg) {
      return pick(pkg, [
        'id', 'name', 'description', 'npmURL', 'gitHubURL', 'itemCreatedOn'
      ]);
    });

    this.body = results;

    sendUAEvent(this, 'backend', 'getNewPackages');
  });

  router.get('/feeds/daily', createUAVisitor, function *() {
    let posts = yield app.store.Post.find({
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

    this.type = 'application/rss+xml; charset=utf-8';
    this.body = xml;

    sendUAEvent(this, 'backend', 'getDailyFeed');
  });

  router.get('/feeds/real-time', createUAVisitor, function *() {
    let packages = yield app.store.Package.find({
      query: { visible: true },
      order: 'itemCreatedOn',
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
        date: pkg.itemCreatedOn,
        guid: pkg.id
      });
    }

    let xml = feed.xml({ indent: true });

    this.type = 'application/rss+xml; charset=utf-8';
    this.body = xml;

    sendUAEvent(this, 'backend', 'getRealTimeFeed');
  });

  // === Server initialization ===

  let root = koa();
  root.name = app.name;
  root.proxy = true;
  root.use(cors());
  root.use(app.log.getLoggerMiddleware());
  root.use(mount('/v1', v1));

  root.listen(options.port, function() {
    app.log.info('Listening on port ' + options.port);
  });
}

export let server = { start };

export default server;
