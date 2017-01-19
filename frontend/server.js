'use strict';

import koa from 'koa';
import convert from 'koa-convert';
import rewrite from 'koa-rewrite';
import staticCache from 'koa-static-cache';

export class Server {
  constructor(app, options = {}) {
    this.app = app;
    this.path = options.path;
    this.port = options.port;
  }

  start() {
    const root = new koa();
    root.name = this.app.name;
    root.proxy = true;

    // curl -v http://dev.npmaddict.com:20576/health-check
    root.use(async (ctx, next) => {
      if (ctx.url === '/health-check') {
        ctx.body = 'OK';
      } else {
        await next();
      }
    });

    root.use(convert(this.app.log.getLoggerMiddleware()));

    root.use(convert(rewrite('/', '/index.html')));

    const development = this.app.environment === 'development';
    root.use(convert(staticCache(this.path, {
      buffer: !development,
      gzip: !development,
      dynamic: development
    })));

    root.listen(this.port, () => {
      this.app.log.info('Listening on port ' + this.port);
    });
  }
}

export default Server;
