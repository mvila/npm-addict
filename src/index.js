'use strict';

import EventEmitterMixin from 'event-emitter-mixin';
import UniversalLog from 'universal-log';
import fetch from 'isomorphic-fetch';
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
  @field(Date, { validators: 'filled' }) createdOn;
  @field(Date, { validators: 'filled' }) updatedOn;
  @field(Object) rawNPMResult;
  @field(Object) rawGitHubResult;
  @createdOn() _itemCreatedOn;
  @updatedOn() _itemUpdatedOn;
}

class Store extends LocalStore {
  @model(AppState) AppState;
  @model(Package) Package;
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
    this.npmPackageURL = 'http://registry.npmjs.org/';
    this.gitHubAPIURL = 'https://api.github.com/';
    this.gitHubUsername = 'mvila';
    this.gitHubPersonalAccessToken = '5169f297fa7d627c4b1b5bf1f0e345dbff117198';
  }

  async run() {
    await this.initialize();
    let startDate = new Date(this.state.npmUpdatedPackagesLastDate.valueOf() + 1);
    let result = await this.fetchUpdatedPackages(startDate);
    for (let name of result.packages) {
      console.log(name);
    }
    if (result.lastDate) {
      this.state.npmUpdatedPackagesLastDate = result.lastDate;
      await this.state.save();
    }
  }

  async initialize() {
    this.state = await this.store.AppState.get('AppState', { errorIfMissing: false });
    if (!this.state) {
      this.state = new this.store.AppState();
    }
  }

  async fetchUpdatedPackages(startDate) {
    let startKey = [startDate];
    let url = this.npmUpdatedPackagesURL;
    url += '&startkey=' + encodeURIComponent(JSON.stringify(startKey));
    let response = await fetch(url);
    if (response.status !== 200) {
      throw new Error(`Bad response from npm registry while fetching updated packages (HTTP status: ${response.status})`);
    }
    let result = await response.json();
    let rows = result.rows;
    let packages = [];
    let lastDate;
    for (let row of rows) {
      packages.push(row.key[1]);
      lastDate = new Date(row.key[0]);
    }
    return { packages, lastDate };
  }

  async fetchPackage(name) {
    try {
      let url = this.npmPackageURL + name;
      let response = await fetch(url);
      if (response.status !== 200) {
        this.log.warning(`Bad response from npm registry while fetching '${name}' package (HTTP status: ${response.status})`);
        return undefined;
      }
      let result = await response.json();
      let gitHubResult;
      let parsedGitHubURL;
      if (result.repository && result.repository.type === 'git') {
        parsedGitHubURL = parseGitHubURL(result.repository.url);
      }
      if (!parsedGitHubURL) {
        this.log.notice(`'${name}' package has invalid or empty GitHub URL`);
      }
      let promote = this.getPromoteProperty(result);
      if (promote === false) return undefined;
      if (!promote) {
        if (!parsedGitHubURL) return undefined;
        gitHubResult = await this.fetchGitHubRepository(parsedGitHubURL);
        let gitHubStars = gitHubResult && gitHubResult.stargazers_count;
        if (gitHubStars == null) return undefined;
        if (gitHubStars < 3) {
          this.log.info(`'${name}' package has not enough stars (${gitHubStars}<3)`);
          return undefined;
        }
      }
      let createdOn = result.time && result.time.created && new Date(result.time.created);
      let updatedOn = result.time && result.time.modified && new Date(result.time.modified);
      let pkg = {
        name: result.name,
        description: result.description,
        createdOn,
        updatedOn,
        rawNPMResult: result,
        rawGitHubResult: gitHubResult
      };
      return pkg;
    } catch (err) {
      this.log.warning(`An error occured while fetching '${name}' package from npm registry (${err.message})`);
      return undefined;
    }
  }

  getPromoteProperty(data) {
    let latestVersion = data['dist-tags'] && data['dist-tags'].latest;
    if (!latestVersion) return undefined;
    data = data.versions && data.versions[latestVersion];
    if (!data) return undefined;
    return data.promote;
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
