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
    await this.initialize();

    let result;

    let command = this.argv._[0];
    if (!command) throw new Error('Command is missing');
    switch (command) {
      case 'start':
        result = await this.start();
        break;
      case 'ignore':
        let name = this.argv._[1];
        if (!name) throw new Error('Package name is missing');
        result = await this.ignore(name);
        break;
      default:
        throw new Error(`Unknown command '${command}'`);
    }

    if (result !== 'KEEP_ALIVE') {
      await this.close();
    }
  }

  async initialize() {
    this.state = await this.store.BackendState.get('BackendState', { errorIfMissing: false });
    if (!this.state) {
      this.state = new this.store.BackendState();
    }
  }

  async close() {
    await this.store.close();
  }

  async start() {
    this.fetcher = new Fetcher({ context: this });
    this.fetcher.run().catch(err => {
      this.log.error(err);
      this.log.emergency('Fetcher crashed');
      this.notifier.notify(`Fetcher crashed (${err.message})`);
    });

    server.start(this, { port: this.port });

    return 'KEEP_ALIVE';
  }

  async ignore(name) {
    let ignoredPackage = await this.store.IgnoredPackage.getByName(name);
    if (ignoredPackage) {
      this.log.warning(`'${name}' package has already been ignored`);
      return;
    }
    let pkg = await this.store.Package.getByName(name);
    if (pkg) {
      await pkg.delete();
      this.log.info(`'${name}' package deleted`);
    }
    await this.store.IgnoredPackage.put({
      name,
      reason: 'MANUALLY_IGNORED'
    });
    this.log.info(`'${name}' package has been manually marked as ignored`);
  }
}

let backend = new Application({ name: 'npm-addict-backend' });

backend.run().catch(function(err) {
  backend.handleUncaughtException(err);
});
