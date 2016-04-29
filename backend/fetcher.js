'use strict';

import fetch from 'isomorphic-fetch';
import sleep from 'sleep-promise';
import parseGitHubURL from 'github-url-to-object';
// let stripMarkdown = require('remark').use(require('strip-markdown'));

const FETCH_TIMEOUT = 3 * 60 * 1000; // 3 minutes

export class Fetcher {
  constructor(app) {
    this.app = app;

    this.npmUpdatedPackagesURL = 'https://registry.npmjs.org/-/_view/browseUpdated?group_level=2';
    this.npmWebsitePackageURL = 'https://www.npmjs.com/package/';
    this.npmAPIPackageURL = 'https://registry.npmjs.org/';
    this.gitHubAPIURL = 'https://api.github.com/';
    this.gitHubUsername = 'mvila';
    if (!process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
      throw new Error('GITHUB_PERSONAL_ACCESS_TOKEN environment variable is missing');
    }
    this.gitHubPersonalAccessToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  }

  async run() {
    while (true) {
      let startDate = new Date(this.app.state.lastModificationDate.valueOf() + 1);
      let result = await this.findUpdatedPackages(startDate);
      this.app.log.notice(`${result.packages.length} updated packages found in npm registry`);
      for (let name of result.packages) {
        await this.updatePackage(name);
      }
      if (result.lastDate) {
        this.app.state.lastModificationDate = result.lastDate;
      }
      this.app.state.lastFetchDate = new Date();
      await this.app.state.save();
      await sleep(5 * 60 * 1000); // 5 minutes
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
      this.app.log.warning(`An error occured while fetching updated packages from npm registry (${err.message})`);
    }
    return { packages, lastDate };
  }

  async updatePackage(name) {
    let pkg = await this.fetchPackage(name);
    if (!pkg) return;
    let item = await this.app.store.Package.getByName(name);
    if (!item) item = new this.app.store.Package();
    Object.assign(item, pkg);
    let visible = item.determineVisibility(this.app.log);
    if (item.isNew && !visible) return;
    if (visible !== item.visible) {
      if (!item.isNew) {
        this.app.log.info(`'${name}' package visibility changed to ${visible ? 'visible' : 'invisible'}`);
      }
      item.visible = visible;
    }
    let wasNew = item.isNew;
    await item.save();
    this.app.log.info(`'${name}' package ${wasNew ? 'created' : 'updated'}`);
    if (wasNew) await this.app.tweet(item);
  }

  async fetchPackage(name) {
    try {
      let ignoredPackage = await this.app.store.IgnoredPackage.getByName(name);
      if (ignoredPackage) {
        this.app.log.debug(`'${name}' package ignored`);
        return undefined;
      }

      let npmURL = this.npmWebsitePackageURL + name;

      let url = this.npmAPIPackageURL + name;
      let response = await fetch(url, { timeout: FETCH_TIMEOUT });
      if (response.status !== 200) {
        this.app.log.warning(`Bad response from npm registry while fetching '${name}' package (HTTP status: ${response.status})`);
        return undefined;
      }
      let npmResult = await response.json();

      let createdOn = npmResult.time && npmResult.time.created && new Date(npmResult.time.created);
      let updatedOn = npmResult.time && npmResult.time.modified && new Date(npmResult.time.modified);

      if (!createdOn) {
        this.app.log.warning(`'${name}' package doesn't have a creation date`);
        return undefined;
      }
      let minimumDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 3 months
      if (createdOn < minimumDate) {
        await this.app.store.IgnoredPackage.put({
          name,
          reason: 'CREATION_DATE_BEFORE_MINIMUM'
        });
        this.app.log.info(`'${name}' package has been marked as ignored (creation date: ${createdOn.toISOString()})`);
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
            this.app.log.debug(`'${name}' package has an invalid GitHub URL (${npmResult.repository.url})`);
          }
        } else {
          this.app.log.debug(`'${name}' package has a Git respository not hosted by GitHub (${npmResult.repository.url})`);
        }
      } else {
        this.app.log.debug(`'${name}' package doesn't have a Git respository`);
      }

      let gitHubPackageJSON;
      if (gitHubResult) {
        gitHubPackageJSON = await this.getGitHubPackageJSON(parsedGitHubURL);
      }

      let description = npmResult.description;
      if (description && gitHubPackageJSON && !gitHubPackageJSON.description) {
        // // When the description is missing from package.json,
        // // npm generates one from the README, let's try to remove
        // // markdown tags from it
        // let original = description;
        // description = stripMarkdown.process(description);
        // description = description.trim();
        // if (description !== original) {
        //   this.log.warning(`Markdown tags have been removed from a description ("${original}" => "${description}")`);
        // }
        description = undefined; // In the end, the description generated by npm from the README appears to be too bad
      }

      return {
        name: npmResult.name,
        description,
        npmURL,
        gitHubURL: parsedGitHubURL && parsedGitHubURL.https_url,
        createdOn,
        updatedOn,
        npmResult,
        gitHubResult,
        gitHubPackageJSON
      };
    } catch (err) {
      this.app.log.warning(`An error occured while fetching '${name}' package from npm registry (${err.message})`);
      return undefined;
    }
  }

  async fetchGitHubRepository({ user, repo }) {
    try {
      let url = `${this.gitHubAPIURL}repos/${user}/${repo}`;
      return await this.requestGitHubAPI(url);
    } catch (err) {
      this.app.log.warning(`An error occured while fetching '${user}/${repo}' repository from GitHub API (${err.message})`);
      return undefined;
    }
  }

  async getGitHubPackageJSON({ user, repo }) {
    try {
      let url = `${this.gitHubAPIURL}repos/${user}/${repo}/contents/package.json`;
      let file = await this.requestGitHubAPI(url);
      if (!file) return false;
      if (file.encoding !== 'base64') {
        throw new Error('Unsupported GitHub file encoding');
      }
      let json = file.content;
      json = new Buffer(json, 'base64').toString();
      let pkg = JSON.parse(json);
      return pkg;
    } catch (err) {
      this.app.log.warning(`An error occured while fetching package.json file from '${user}/${repo}' GitHub repository (${err.message})`);
      return undefined;
    }
  }

  async requestGitHubAPI(url) {
    let auth = this.gitHubUsername + ':' + this.gitHubPersonalAccessToken;
    auth = new Buffer(auth).toString('base64');
    let response = await fetch(url, {
      headers: {
        Authorization: 'Basic ' + auth
      },
      timeout: FETCH_TIMEOUT
    });
    if (response.status === 404) {
      this.app.log.debug(`GitHub API returned a 404 Not Found status for '${url}' URL`);
      return undefined;
    } else if (response.status !== 200) {
      this.app.log.warning(`Bad response from GitHub API while requesting '${url}' URL (HTTP status: ${response.status})`);
      return undefined;
    }
    return await response.json();
  }
}

export default Fetcher;
