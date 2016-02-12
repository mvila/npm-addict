'use strict';

let koa = require('koa');
let rewrite = require('koa-rewrite');
let staticCache = require('koa-static-cache');
let gzip = require('koa-gzip');

export class Server {
  constructor(app, options = {}) {
    this.app = app;
    this.path = options.path;
    this.port = options.port;
  }

  start() {
    function ping() {
      return function *(next) {
        if (this.url === '/ping') {
          this.status = 200;
          this.body = 'pong';
          this.logLevel = 'silence';
        } else {
          yield next;
        }
      };
    }

    let root = koa();
    root.name = this.app.name;
    root.proxy = true;
    root.use(this.app.log.getLoggerMiddleware());
    root.use(ping());
    root.use(gzip());
    root.use(rewrite('/', '/index.html'));
    root.use(staticCache(this.path, { dynamic: true }));

    root.listen(this.port, () => {
      this.app.log.info('Listening on port ' + this.port);
    });
  }
}

export default Server;
