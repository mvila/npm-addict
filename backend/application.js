'use strict';

import util from 'util';
import BackendApplication from '../backend-application';
import Store from './store';
import Twitter from './twitter';
import Fetcher from './fetcher';
import Feeder from './feeder';
import Server from './server';

class Application extends BackendApplication {
  constructor(options) {
    super(options);

    if (!process.env.STORE_URL) {
      throw new Error('STORE_URL environment variable is missing');
    }
    this.store = new Store({
      context: this,
      name: 'npmAddict',
      url: process.env.STORE_URL
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
    let name;
    switch (command) {
      case 'start':
        let fetch = this.argv.fetch;
        if (fetch == null) fetch = this.environment === 'production';
        result = await this.start({ fetch });
        break;
      case 'refetch':
        // node backend refetch --start=0 --no-aws-cloud-watch-logs --no-slack-notifications &> refetch.log &
        let start = 0;
        if (this.argv.start) start = Number(this.argv.start);
        result = await this.refetch(start);
        break;
      case 'stats':
        result = await this.stats();
        break;
      case 'show':
        name = this.argv._[1];
        if (name) {
          result = await this.show(name);
        } else if (this.argv.ignored) {
          result = await this.showIgnored();
        } else {
          throw new Error('A parameter is missing');
        }
        break;
      case 'delete':
        name = this.argv._[1];
        if (name) {
          result = await this.delete(name);
        } else {
          throw new Error('A parameter is missing');
        }
        break;
      case 'ignore':
        name = this.argv._[1];
        if (!name) throw new Error('Package name is missing');
        result = await this.ignore(name);
        break;
      case 'unreveal':
        name = this.argv._[1];
        if (!name) throw new Error('Package name is missing');
        result = await this.unreveal(name);
        break;
      case 'update':
        name = this.argv._[1];
        if (name) {
          result = await this.update(name);
        } else {
          if (!this.argv.all) throw new Error('Package name or --all option is missing');
          result = await this.updateAll();
        }
        break;
      case 'tweet':
        name = this.argv._[1];
        if (!name) throw new Error('Package name is missing');
        result = await this.tweet(name);
        break;
      case 'fix':
        result = await this.fix();
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

    await this.upgradeToVersion2();
    await this.upgradeToVersion3();

    this.twitter = new Twitter(this);
    this.fetcher = new Fetcher(this);
    this.feeder = new Feeder(this);
    this.server = new Server(this, { port: this.port });
  }

  async upgradeToVersion2() {
    if (this.state.version >= 2) return;

    this.log.info('Upgrading backend data to version 2...');

    await this.store.Package.forEach({}, async (pkg) => {
      if (pkg.visible) {
        pkg.revealed = true;
        pkg.revealedOn = pkg.itemCreatedOn;
      }
      pkg.visible = undefined;
      pkg.forced = undefined;
      await pkg.save();
    });

    this.state.version = 2;
    await this.state.save();

    this.log.info('Backend data upgraded to version 2');
  }

  async upgradeToVersion3() {
    if (this.state.version >= 3) return;

    this.log.info('Upgrading backend data to version 3...');

    await this.store.IgnoredPackage.forEach({}, async (ignoredPackage) => {
      if (ignoredPackage.reason === 'CREATION_DATE_BEFORE_MINIMUM') {
        await ignoredPackage.delete();
      }
    });

    this.state.version = 3;
    await this.state.save();

    this.log.info('Backend data upgraded to version 3');
  }

  async close() {
    await this.fetcher.close();
    await this.twitter.close();
    await this.store.close();
  }

  async start(options = {}) {
    if (options.fetch) {
      this.fetcher.run().catch(err => {
        this.log.error(err);
        this.log.emergency('Fetcher crashed');
        this.notifier.notify(`Fetcher crashed (${err.message})`);
      });
    }

    this.feeder.run().catch(err => {
      this.log.error(err);
      this.log.emergency('Feeder crashed');
      this.notifier.notify(`Feeder crashed (${err.message})`);
    });

    this.server.start();

    this.notifier.notify(`${this.displayName} backend started (v${this.version})`);

    return 'KEEP_ALIVE';
  }

  async refetch(start) {
    let refetcher = new Fetcher(this, true);
    await refetcher.refetch(start);
  }

  async stats() {
    let count;
    count = await this.store.Package.count();
    console.log(`Packages: ${count}`);
    count = await this.store.IgnoredPackage.count();
    console.log(`Ignored packages: ${count}`);
    count = await this.store.Post.count();
    console.log(`Posts: ${count}`);
    let result = await this.fetcher.getGitHubAPIRateLimit();
    result = result.resources.core;
    console.log(`GitHub API rate limit: ${result.limit} requests (${result.remaining} remaining, reset in ${Math.round(result.reset - Date.now() / 1000)} seconds)`);
  }

  async show(name) {
    let pkg = await this.store.Package.getByName(name);
    if (!pkg) {
      console.error(`'${name}' package not found in the database`);
      return;
    }
    pkg = pkg.toJSON();
    console.log(util.inspect(pkg, { depth: null, colors: true }));
  }

  async showIgnored() {
    await this.store.IgnoredPackage.forEach({}, (pkg) => {
      console.log(`${pkg.name} (${pkg.reason})`);
    });
  }

  async delete(name) {
    let pkg = await this.store.Package.getByName(name);
    if (pkg) {
      await pkg.delete();
      console.log(`'${name}' Package item deleted`);
    }
    let ignoredPackage = await this.store.IgnoredPackage.getByName(name);
    if (ignoredPackage) {
      await ignoredPackage.delete();
      console.log(`'${name}' IgnoredPackage item deleted`);
    }
  }

  async ignore(name) {
    let ignoredPackage = await this.store.IgnoredPackage.getByName(name);
    if (ignoredPackage) {
      console.error(`'${name}' package has already been ignored`);
      return;
    }
    let pkg = await this.store.Package.getByName(name);
    if (pkg) {
      await pkg.delete();
      console.log(`'${name}' package deleted`);
    }
    await this.store.IgnoredPackage.put({
      name,
      reason: 'MANUALLY_IGNORED'
    });
    console.log(`'${name}' package has been manually marked as ignored`);
  }

  async unreveal(name) {
    let pkg = await this.store.Package.getByName(name);
    if (!pkg) {
      console.error(`'${name}' package not found in the database`);
      return;
    }
    pkg.revealed = undefined;
    pkg.revealedOn = undefined;
    await pkg.save();
    console.log(`'${name}' package has been unrevealed`);
  }

  async update(name) {
    await this.fetcher.createOrUpdatePackage(name);
  }

  async updateAll() {
    await this.store.Package.forEach({}, async (pkg) => {
      await this.fetcher.createOrUpdatePackage(pkg.name);
    });
  }

  async tweet(pkg) {
    if (typeof pkg === 'string') {
      let name = pkg;
      pkg = await this.store.Package.getByName(name);
      if (!pkg) {
        console.error(`'${name}' package not found`);
        return;
      }
    }
    let text = pkg.name + ': ' + pkg.formattedDescription;
    try {
      await this.twitter.post(text, pkg.bestURL);
    } catch (err) {
      this.app.log.warning(`An error occured while tweeting '${pkg.name}' package`);
    }
  }

  async fix() {
    await this.store.Package.forEach({}, async (pkg) => {
      let fixed;
      if (pkg.gitHubResult) {
        if (pkg.gitHubPackageJSON && pkg.gitHubPackageJSON.name !== pkg.name) {
          pkg.gitHubPackageJSON = undefined;
          fixed = true;
        }
        if (!pkg.gitHubPackageJSON && pkg.gitHubStars != null) {
          pkg.gitHubStars = undefined;
          fixed = true;
        }
      }
      if (fixed) {
        await pkg.save();
        console.log(`'${pkg.name}' package has been fixed`);
      }
    });
  }
}

let app = new Application({ name: 'npm-addict-backend' });

app.run().catch(function(err) {
  app.handleUncaughtException(err);
});
