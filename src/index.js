'use strict';

import EventEmitterMixin from 'event-emitter-mixin';
import UniversalLog from 'universal-log';
import fetch from 'isomorphic-fetch';
import sleep from 'sleep-promise';
import parseGitHubURL from 'github-url-to-object';
import { LocalStore, model, Model, primaryKey, field, createdOn, updatedOn } from 'object-layer';
let pkg = require('../package.json');

class AppState extends Model {
  @primaryKey(String, { defaultValue: 'AppState' }) id;
  @field(Date, {
    defaultValue: () => new Date(Date.now() - 60 * 60 * 1000)
  }) npmUpdatedPackagesLastDate;
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
    if (promote === false) {
      if (log) {
        log.info(`'${this.name}' package has a promote property set to false`);
      }
      return false;
    }
    if (!promote) {
      let gitHubStars = this.getGitHubStars();
      if (gitHubStars == null) return false;
      if (gitHubStars < 3) {
        if (log) {
          log.info(`'${this.name}' package has not enough stars (${gitHubStars}<3)`);
        }
        return false;
      }
    }
    return true;
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

class Store extends LocalStore {
  @model(AppState) AppState;
  @model(Package, {
    indexes: ['name', ['visible', 'itemCreatedOn']]
  }) Package;
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
      name: '1PlaceNPMIntegration',
      url: 'mysql://root:secret@localhost/1place'
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
      let startDate = new Date(this.state.npmUpdatedPackagesLastDate.valueOf() + 1);
      let result = await this.findUpdatedPackages(startDate);
      await this.updatePackages(result.packages);
      if (result.lastDate) {
        this.state.npmUpdatedPackagesLastDate = result.lastDate;
        await this.state.save();
      }
      await sleep(60 * 1000);
    }
  }

  async initialize() {
    this.state = await this.store.AppState.get('AppState', { errorIfMissing: false });
    if (!this.state) {
      this.state = new this.store.AppState();
    }
  }

  async findUpdatedPackages(startDate) {
    let packages = [];
    let lastDate;
    try {
      let startKey = [startDate];
      let url = this.npmUpdatedPackagesURL;
      url += '&startkey=' + encodeURIComponent(JSON.stringify(startKey));
      let response = await fetch(url);
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
      await item.save();
      this.log.info(`'${name}' package ${item.isNew ? 'created' : 'updated'}`);
    }
  }

  async fetchPackage(name) {
    try {
      let npmURL = this.npmWebsitePackageURL + name;
      let url = this.npmAPIPackageURL + name;
      let response = await fetch(url);
      if (response.status !== 200) {
        this.log.warning(`Bad response from npm registry while fetching '${name}' package (HTTP status: ${response.status})`);
        return undefined;
      }
      let npmResult = await response.json();
      let gitHubResult;
      let parsedGitHubURL;
      if (npmResult.repository && npmResult.repository.type === 'git') {
        if (npmResult.repository.url.includes('github')) {
          parsedGitHubURL = parseGitHubURL(npmResult.repository.url);
          if (parsedGitHubURL) {
            gitHubResult = await this.fetchGitHubRepository(parsedGitHubURL);
          } else {
            this.log.notice(`'${name}' package has an invalid GitHub URL (${npmResult.repository.url})`);
          }
        } else {
          this.log.notice(`'${name}' package has a Git respository not hosted by GitHub (${npmResult.repository.url})`);
        }
      } else {
        this.log.notice(`'${name}' package doesn't have a Git respository`);
      }
      let pkg = {
        name: npmResult.name,
        description: npmResult.description,
        npmURL,
        gitHubURL: parsedGitHubURL && parsedGitHubURL.https_url,
        createdOn: npmResult.time && npmResult.time.created && new Date(npmResult.time.created),
        updatedOn: npmResult.time && npmResult.time.modified && new Date(npmResult.time.modified),
        npmResult,
        gitHubResult
      };
      return pkg;
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
        }
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
