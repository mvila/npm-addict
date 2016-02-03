'use strict';

import koa from 'koa';
import cors from 'koa-cors';
import mount from 'koa-mount';
import koaRouter from 'koa-router';
import ua from 'universal-analytics';

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

  router.get('/new-packages', createUAVisitor, function *() {
    let startAfter = this.query.startAfter;
    let limit = Number(this.query.limit) || 100;
    if (limit > 300) {
      throw new Error('\'limit\' parameter cannot be greater than 300');
    }
    let packages = yield app.store.Package.find({
      query: { visible: true },
      order: 'itemCreatedOn',
      startAfter,
      reverse: true,
      limit
    });

    let results = packages.map(function(pkg) {
      return {
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        npmURL: pkg.npmURL,
        gitHubURL: pkg.gitHubURL,
        date: pkg.itemCreatedOn
      };
    });

    this.body = results;

    sendUAEvent(this, 'backend', 'getNewPackages');
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
