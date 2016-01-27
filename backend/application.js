'use strict';

import AbstractBackendApplication from '../abstract-application/backend';
import Store from './store';
import Fetcher from './fetcher';

class Application extends AbstractBackendApplication {
  constructor(options) {
    super(options);

    this.store = new Store({
      context: this,
      name: 'npmAddict',
      url: 'mysql://root:secret@localhost/npm_addict'
    });
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
