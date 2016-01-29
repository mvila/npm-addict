'use strict';

let pathModule = require('path');
let childProcess = require('child_process');
import BaseBackendApplication from './base-application/backend';

class Application extends BaseBackendApplication {
  constructor(options) {
    super(options);
  }

  async run() {
    let command = this.argv._[0];
    if (!command) throw new Error('Command is missing');
    let options = {};
    if (this.argv.watch) options.watchMode = true;
    switch (command) {
      case 'build':
        await this.build(options);
        break;
      case 'start':
        await this.start(options);
        break;
      case 'build-and-start':
        await this.build(options);
        await this.start(options);
        break;
      default:
        throw new Error(`Unknown command '${command}'`);
    }
  }

  async build(options) {
    let path;

    let opts = [];
    if (options.watchMode) opts.push('--watch');

    path = pathModule.join(__dirname, 'frontend', 'index.js');
    this.spawn('node', path, 'build', ...opts);
  }

  async start(options) {
    this.notifier.notify(`${this.displayName} started (v${this.version})`);

    let path;
    let node = (options.watchMode ? 'node-dev' : 'node');

    path = pathModule.join(__dirname, 'backend', 'index.js');
    this.spawn(node, path, 'start');

    path = pathModule.join(__dirname, 'frontend', 'index.js');
    this.spawn(node, path, 'start');
  }

  spawn(cmd, ...args) {
    childProcess.spawn(cmd, args, { stdio: 'inherit' });
  }
}

let runner = new Application();

runner.run().catch(function(err) {
  runner.handleUncaughtException(err);
});
