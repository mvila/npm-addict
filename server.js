'use strict';

let koa = require('koa');
let serve = require('koa-static');
let gzip = require('koa-gzip');

function start(app, options = {}) {
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
  root.name = app.name;
  root.use(app.log.getLoggerMiddleware());
  root.use(ping());
  root.use(gzip());
  root.use(serve(options.path, { format: true }));

  root.listen(options.port, function() {
    app.log.info('Listening on port ' + options.port);
  });
}

export let server = { start };

export default server;
