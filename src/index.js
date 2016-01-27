'use strict';

import EventEmitterMixin from 'event-emitter-mixin';
import UniversalLog from 'universal-log';
import fetch from 'isomorphic-fetch';
import sleep from 'sleep-promise';
import parseGitHubURL from 'github-url-to-object';
import { LocalStore, model, Model, primaryKey, field, createdOn, updatedOn } from 'object-layer';
let pkg = require('../package.json');

const FETCH_TIMEOUT = 3 * 60 * 1000; // 3 minutes

class BackendState extends Model {
  @primaryKey(String, { defaultValue: 'BackendState' }) id;
  @field(Date, {
    defaultValue: () => new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours
  }) minimumCreationDate;
  @field(Date, {
    defaultValue: () => new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours
  }) lastModificationDate;
}

class Package extends Model {
  @primaryKey() id;
  @field(String, { validators: 'filled' }) name;
  @field(String) description;
  @field(String) npmURL;
  @field(String) gitHubURL;
  @field(Boolean) visible;
  @field(Date, { validators: 'filled' }) createdOn;
  @field(Date, { validators: 'filled' }) updatedOn;
  @field(Object) npmResult;
  @field(Object) gitHubResult;
  @createdOn() itemCreatedOn;
  @updatedOn() itemUpdatedOn;

  determineVisibility(log) {
    let promote = this.getPromoteProperty();
    if (promote != null) {
      if (log) {
        log.notice(`'${this.name}' package has a promote property set to ${promote ? 'true' : 'false'}`);
      }
      return promote;
    }
    let gitHubStars = this.getGitHubStars();
    if (gitHubStars == null) return false;
    if (gitHubStars >= 3) return true;
    if (log) {
      log.info(`'${this.name}' package has not enough stars (${gitHubStars} of 3)`);
    }
    return false;
  }

  getPromoteProperty() {
    let pkg = this.npmResult;
    let latestVersion = pkg['dist-tags'] && pkg['dist-tags'].latest;
    if (!latestVersion) return undefined;
    pkg = pkg.versions && pkg.versions[latestVersion];
    if (!pkg) return undefined;
    return pkg.promote;
  }

  getGitHubStars() {
    return this.gitHubResult && this.gitHubResult.stargazers_count;
  }
}

class IgnoredPackage extends Model {
  @primaryKey() id;
  @field(String, { validators: 'filled' }) name;
  @field(String) reason;
}

class Store extends LocalStore {
  @model(BackendState) BackendState;
  @model(Package, {
    indexes: ['name', ['visible', 'itemCreatedOn']]
  }) Package;
  @model(IgnoredPackage, { indexes: ['name'] }) IgnoredPackage;
}

class Application extends EventEmitterMixin() {
  constructor({ name, displayName, version } = {}) {
    super();

    this.name = name || pkg.name;
    this.displayName = displayName || pkg.displayName || pkg.name;
    this.version = version || pkg.version;

    this.log = new UniversalLog({ appName: this.name });

    this.store = new Store({
      context: this,
      name: 'npmAddict',
      url: 'mysql://root:secret@localhost/npm_addict'
    });

    this.npmUpdatedPackagesURL = 'http://registry.npmjs.org/-/_view/browseUpdated?group_level=2';
    this.npmWebsitePackageURL = 'https://www.npmjs.com/package/';
    this.npmAPIPackageURL = 'http://registry.npmjs.org/';
    this.gitHubAPIURL = 'https://api.github.com/';
    this.gitHubUsername = 'mvila';
    this.gitHubPersonalAccessToken = '5169f297fa7d627c4b1b5bf1f0e345dbff117198';
  }

  async run() {
    await this.initialize();
    // await this.fetchPackage('webpack-config-json');
    while (true) {
      let startDate = new Date(this.state.lastModificationDate.valueOf() + 1);
      let result = await this.findUpdatedPackages(startDate);
      this.log.notice(`${result.packages.length} updated packages found in npm registry`);
      await this.updatePackages(result.packages);
      if (result.lastDate) {
        this.state.lastModificationDate = result.lastDate;
        await this.state.save();
      }
      await sleep(5 * 60 * 1000); // 5 minutes
    }
  }

  async initialize() {
    this.state = await this.store.BackendState.get('BackendState', { errorIfMissing: false });
    if (!this.state) {
      this.state = new this.store.BackendState();
    }
  }

  async findUpdatedPackages(startDate) {
    let packages = [];
    let lastDate;
    try {
      let startKey = [startDate];
      let url = this.npmUpdatedPackagesURL;
      url += '&startkey=' + encodeURIComponent(JSON.stringify(startKey));
      let response = await fetch(url, { timeout: FETCH_TIMEOUT });
      if (response.status !== 200) {
        throw new Error(`Bad response from npm registry while fetching updated packages (HTTP status: ${response.status})`);
      }
      let result = await response.json();
      let rows = result.rows;
      for (let row of rows) {
        packages.push(row.key[1]);
        lastDate = new Date(row.key[0]);
      }
    } catch (err) {
      this.log.warning(`An error occured while fetching updated packages from npm registry (${err.message})`);
    }
    return { packages, lastDate };
  }

  async updatePackages(packages) {
    for (let name of packages) {
      let pkg = await this.fetchPackage(name);
      if (!pkg) continue;
      let packages = await this.store.Package.find({ query: { name }, limit: 1 });
      let item = packages[0] || new this.store.Package();
      Object.assign(item, pkg);
      let visible = item.determineVisibility(this.log);
      if (item.isNew && !visible) continue;
      if (visible !== item.visible) {
        if (!item.isNew) {
          this.log.info(`'${name}' package visibility changed to ${visible ? 'visible' : 'invisible'}`);
        }
        item.visible = visible;
      }
      let wasNew = item.isNew;
      await item.save();
      this.log.info(`'${name}' package ${wasNew ? 'created' : 'updated'}`);
    }
  }

  async fetchPackage(name) {
    try {
      let packages = await this.store.IgnoredPackage.find({ query: { name }, limit: 1 });
      if (packages.length) {
        this.log.debug(`'${name}' package ignored`);
        return undefined;
      }

      let npmURL = this.npmWebsitePackageURL + name;

      let url = this.npmAPIPackageURL + name;
      let response = await fetch(url, { timeout: FETCH_TIMEOUT });
      if (response.status !== 200) {
        this.log.warning(`Bad response from npm registry while fetching '${name}' package (HTTP status: ${response.status})`);
        return undefined;
      }
      let npmResult = await response.json();

      let createdOn = npmResult.time && npmResult.time.created && new Date(npmResult.time.created);
      let updatedOn = npmResult.time && npmResult.time.modified && new Date(npmResult.time.modified);

      if (!createdOn) {
        this.log.warning(`'${name}' package doesn't have a creation date`);
        return undefined;
      }
      if (createdOn < this.state.minimumCreationDate) {
        await this.store.IgnoredPackage.put({
          name,
          reason: 'CREATION_DATE_BEFORE_MINIMUM'
        });
        this.log.info(`'${name}' package has been marked as ignored (creation date: ${createdOn.toISOString()})`);
        return undefined;
      }

      let gitHubResult;
      let parsedGitHubURL;
      if (npmResult.repository && npmResult.repository.type === 'git') {
        if (npmResult.repository.url.includes('github')) {
          parsedGitHubURL = parseGitHubURL(npmResult.repository.url);
          if (parsedGitHubURL) {
            gitHubResult = await this.fetchGitHubRepository(parsedGitHubURL);
          } else {
            this.log.debug(`'${name}' package has an invalid GitHub URL (${npmResult.repository.url})`);
          }
        } else {
          this.log.debug(`'${name}' package has a Git respository not hosted by GitHub (${npmResult.repository.url})`);
        }
      } else {
        this.log.debug(`'${name}' package doesn't have a Git respository`);
      }

      return {
        name: npmResult.name,
        description: npmResult.description,
        npmURL,
        gitHubURL: parsedGitHubURL && parsedGitHubURL.https_url,
        createdOn,
        updatedOn,
        npmResult,
        gitHubResult
      };
    } catch (err) {
      this.log.warning(`An error occured while fetching '${name}' package from npm registry (${err.message})`);
      return undefined;
    }
  }

  async fetchGitHubRepository({ user, repo }) {
    try {
      let url = `${this.gitHubAPIURL}repos/${user}/${repo}`;
      let auth = this.gitHubUsername + ':' + this.gitHubPersonalAccessToken;
      auth = new Buffer(auth).toString('base64');
      let response = await fetch(url, {
        headers: {
          Authorization: 'Basic ' + auth
        },
        timeout: FETCH_TIMEOUT
      });
      if (response.status !== 200) {
        this.log.warning(`Bad response from GitHub API while fetching '${user}/${repo}' repository (HTTP status: ${response.status})`);
        return undefined;
      }
      return await response.json();
    } catch (err) {
      this.log.warning(`An error occured while fetching '${user}/${repo}' repository from GitHub API (${err.message})`);
      return undefined;
    }
  }
}

let app = new Application();

app.run().catch(app.log.error);
