'use strict';

import AbstractBackendApplication from '../abstract-application/backend';
import Store from './store';
import Fetcher from './fetcher';
import server from './server';

class Application extends AbstractBackendApplication {
  constructor(options) {
    super(options);

    this.store = new Store({
      context: this,
      name: 'npmAddict',
      url: 'mysql://root:secret@localhost/npm_addict'
    });

    this.url = this.apiURL;

    switch (this.environment) {
      case 'development':
        this.port = 8811;
        break;
      case 'test':
        this.port = 8821;
        break;
      case 'production':
        this.port = 8831;
        break;
      default:
        throw new Error(`Unknown environment ('${this.environment}')`);
    }
  }

  async run() {
    let command = this.argv._[0];
    if (!command) throw new Error('Command is missing');
    switch (command) {
      case 'start':
        await this.start();
        break;
      default:
        throw new Error(`Unknown command '${command}'`);
    }
  }

  async start() {
    await this.initialize();

    this.fetcher = new Fetcher({ context: this });
    this.fetcher.run().catch(err => {
      this.log.error(err);
      this.log.emergency('Fetcher crashed');
      this.notifier.notify(`Fetcher crashed (${err.message})`);
    });

    server.start(this, { port: this.port });
  }

  async initialize() {
    this.state = await this.store.BackendState.get('BackendState', { errorIfMissing: false });
    if (!this.state) {
      this.state = new this.store.BackendState();
    }
  }
}

let backend = new Application({ name: 'npm-addict-backend' });

backend.run().catch(function(err) {
  backend.handleUncaughtException(err);
});
