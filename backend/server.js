'use strict';

import koa from 'koa';
import cors from 'koa-cors';
import mount from 'koa-mount';
import koaRouter from 'koa-router';

function start(app, options = {}) {
  let v1 = koa();
  v1.name = 'api';

  let router = koaRouter();
  v1.use(router.routes());
  v1.use(router.allowedMethods());

  router.get('/new-packages', function *() {
    let startAfter = this.query.startAfter;
    let packages = yield app.store.Package.find({
      query: { visible: true },
      order: 'itemCreatedOn',
      startAfter,
      reverse: true,
      limit: 100
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
  });

  // === Server initialization ===

  let root = koa();
  root.name = app.name;
  root.use(cors());
  root.use(app.log.getLoggerMiddleware());
  root.use(mount('/v1', v1));

  root.listen(options.port, function() {
    app.log.info('Listening on port ' + options.port);
  });
}

export let server = { start };

export default server;
