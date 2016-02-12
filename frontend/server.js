'use strict';

import koa from 'koa';
import convert from 'koa-convert';
import rewrite from 'koa-rewrite';
import staticCache from 'koa-static-cache';
import gzip from 'koa-gzip';

export class Server {
  constructor(app, options = {}) {
    this.app = app;
    this.path = options.path;
    this.port = options.port;
  }

  start() {
    let root = new koa();
    root.name = this.app.name;
    root.proxy = true;
    root.use(convert(this.app.log.getLoggerMiddleware()));
    root.use(convert(gzip()));
    root.use(convert(rewrite('/', '/index.html')));
    root.use(convert(staticCache(this.path, { dynamic: true })));

    root.listen(this.port, () => {
      this.app.log.info('Listening on port ' + this.port);
    });
  }
}

export default Server;
