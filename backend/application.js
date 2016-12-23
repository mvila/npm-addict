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
    let name, issue;
    switch (command) {
      case 'start':
        let fetch = this.argv.fetch !== false;
        result = await this.start({ fetch });
        break;
      case 'show':
        name = this.argv._[1];
        if (name) {
          result = await this.show(name);
        } else if (this.argv.invisible) {
          result = await this.showInvisible();
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
        } else if (this.argv.invisible) {
          result = await this.deleteInvisible();
        } else {
          throw new Error('A parameter is missing');
        }
        break;
      case 'ignore':
        name = this.argv._[1];
        if (!name) throw new Error('Package name is missing');
        result = await this.ignore(name);
        break;
      case 'verify':
        name = this.argv._[1];
        if (!name) throw new Error('Package name is missing');
        result = await this.verify(name);
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
      case 'force':
        name = this.argv._[1];
        if (!name) throw new Error('Package name is missing');
        result = await this.force(name);
        break;
      case 'tweet':
        name = this.argv._[1];
        if (!name) throw new Error('Package name is missing');
        result = await this.tweet(name);
        break;
      case 'fix':
        issue = this.argv._[1];
        if (!issue) throw new Error('Issue identifier is missing');
        if (issue === 'incorrectly-ignored-packages') {
          result = await this.fixIncorrectlyIgnoredPackages();
        } else {
          throw new Error('Unknown issue');
        }
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

    this.twitter = new Twitter(this);
    this.fetcher = new Fetcher(this);
    this.feeder = new Feeder(this);
    this.server = new Server(this, { port: this.port });
  }

  async close() {
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

  async show(name) {
    let pkg = await this.store.Package.getByName(name);
    if (!pkg) {
      console.error(`'${name}' package not found in the database`);
    }
    pkg = pkg.toJSON();
    console.log(util.inspect(pkg, { depth: null, colors: true }));
  }

  async showInvisible() {
    let packages = await this.store.Package.find({
      query: { visible: false },
      order: 'itemCreatedOn'
    });
    for (let pkg of packages) {
      console.log(pkg.name);
    }
  }

  async showIgnored() {
    let packages = await this.store.IgnoredPackage.find({ order: 'name' });
    for (let pkg of packages) {
      console.log(`${pkg.name} (${pkg.reason})`);
    }
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

  async deleteInvisible() {
    throw new Error('This command should not be used anymore');
    // let packages = await this.store.Package.find({ query: { visible: false }, order: 'itemCreatedOn' });
    // for (let pkg of packages) {
    //   await this.delete(pkg.name);
    // }
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

  async verify(name) {
    let pkg = await this.fetcher.fetchPackage(name);
    if (!pkg) return;
    let item = new this.store.Package(pkg);
    let visible = item.determineVisibility(this.log);
    console.log(`'${name}' package visibility is: ${visible}`);
  }

  async update(name) {
    await this.fetcher.updatePackage(name);
  }

  async updateAll() {
    let packages = await this.store.Package.find();
    for (let pkg of packages) {
      await this.fetcher.updatePackage(pkg.name);
    }
  }

  async force(name) {
    let ignoredPackage = await this.store.IgnoredPackage.getByName(name);
    if (ignoredPackage) {
      await ignoredPackage.delete();
      console.log(`'${name}' IgnoredPackage item deleted`);
    }
    await this.fetcher.updatePackage(name, true);
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
    await this.twitter.post(text, pkg.bestURL);
  }

  async fixIncorrectlyIgnoredPackages() {
    let ignoredPackages = await this.store.IgnoredPackage.find({ order: 'name' });
    for (let ignoredPackage of ignoredPackages) {
      if (ignoredPackage.reason !== 'CREATION_DATE_BEFORE_MINIMUM') continue;
      let name = ignoredPackage.name;
      let pkg = await this.store.Package.getByName(name);
      if (pkg) {
        console.error(`'${name}' package has been incorrectly ignored`);
        await ignoredPackage.delete();
        console.log(`'${name}' IgnoredPackage item deleted`);
        await this.fetcher.updatePackage(name);
      } else {
        console.error(`'${name}' package has been correctly ignored`);
      }
    }
  }
}

let app = new Application({ name: 'npm-addict-backend' });

app.run().catch(function(err) {
  app.handleUncaughtException(err);
});
