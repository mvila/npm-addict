'use strict';

import fetch from 'isomorphic-fetch';
import ChangesStream from 'changes-stream';
import Package from 'nice-package';
import parseGitHubURL from 'github-url-to-object';
import sleep from 'sleep-promise';
// let stripMarkdown = require('remark').use(require('strip-markdown'));

const FETCH_TIMEOUT = 3 * 60 * 1000; // 3 minutes

export class Fetcher {
  constructor(app, refetchMode) {
    this.app = app;
    this.refetchMode = refetchMode;

    this.npmRegistryURL = 'https://replicate.npmjs.com/registry';
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
    if (this.app.state.lastRegistryUpdateSeq == null) {
      this.app.log.info('Fetching \'lastRegistryUpdateSeq\' from npm registry');
      let url = this.npmRegistryURL;
      let response = await fetch(url, { timeout: FETCH_TIMEOUT });
      if (response.status !== 200) {
        throw new Error(`Bad response from npm registry while getting the last 'update_seq' (HTTP status: ${response.status})`);
      }
      let result = await response.json();
      this.app.state.lastRegistryUpdateSeq = result.update_seq;
      await this.app.state.save();
      this.app.log.info(`'lastRegistryUpdateSeq' setted to ${this.app.state.lastRegistryUpdateSeq}`);
    }

    this.app.log.info(`Listening registry changes (lastRegistryUpdateSeq: ${this.app.state.lastRegistryUpdateSeq})`);

    let changes = new ChangesStream({
      db: this.npmRegistryURL,
      since: this.app.state.lastRegistryUpdateSeq,
      'include_docs': true
    });

    changes.on('readable', async () => {
      let change = changes.read();
      changes.pause();
      try {
        this.app.log.trace(`Registry change received (id: \"${change.id}\", seq: ${change.seq})`);
        if (change.deleted) {
          await this.deletePackage(change.id);
        } else {
          let pkg = await this.createOrUpdatePackage(change.id, change.doc);
          if (pkg && (this.app.state.lastUpdateDate || 0) < pkg.updatedOn) {
            this.app.state.lastUpdateDate = pkg.updatedOn;
          }
        }
        this.app.state.lastRegistryUpdateSeq = change.seq;
        await this.app.state.save();
      } finally {
        changes.resume();
      }
    });
  }

  refetch(startSeq = 0) {
    return new Promise((resolve, reject) => {
      try {
        let endSeq = this.app.state.lastRegistryUpdateSeq;
        if (endSeq == null) {
          throw new Error('\'lastRegistryUpdateSeq\' is undefined');
        }

        this.app.log.info(`Refetching registry from ${startSeq} to ${endSeq}`);

        let changes = new ChangesStream({
          db: this.npmRegistryURL,
          since: startSeq,
          'include_docs': true
        });

        changes.on('readable', async () => {
          let change = changes.read();
          if (change.seq >= endSeq) {
            changes.destroy();
            resolve();
            this.app.log.info('Refetching completed');
            return;
          }
          changes.pause();
          try {
            this.app.log.info(`Refetching package '${change.id}' (seq: ${change.seq})`);
            if (change.deleted) {
              await this.deletePackage(change.id);
            } else {
              await this.createOrUpdatePackage(change.id, change.doc);
            }
            await sleep(1000); // We don't want to exaust GitHub API rate limit
          } finally {
            changes.resume();
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  close() {}

  async createOrUpdatePackage(name, prefetchedNPMResult) {
    let item = await this.app.store.Package.getByName(name);
    if (!item) item = new this.app.store.Package();
    let pkg = await this.fetchPackage(name, item, prefetchedNPMResult);
    if (!pkg) return undefined;
    Object.assign(item, pkg);
    let hasBeenRevealed = false;
    if (!item.revealed && !this.refetchMode) {
      let revealed = item.determineRevealed();
      if (revealed) {
        item.revealed = true;
        item.revealedOn = new Date();
        hasBeenRevealed = true;
      }
    }
    let wasNew = item.isNew;
    await item.save();
    this.app.log.info(`'${name}' package ${wasNew ? 'added' : 'updated'}`);
    if (hasBeenRevealed) {
      this.app.log.info(`'${name}' package revealed`);
      await this.app.tweet(item);
    }
    return item;
  }

  async deletePackage(name) {
    let item = await this.app.store.Package.getByName(name);
    if (!item) return;
    await item.delete();
    this.app.log.info(`'${name}' package deleted`);
  }

  async fetchPackage(name, currentPackage, prefetchedNPMResult) {
    try {
      let ignoredPackage = await this.app.store.IgnoredPackage.getByName(name);
      if (ignoredPackage) {
        this.app.log.debug(`'${name}' package ignored`);
        return undefined;
      }

      let npmResult = prefetchedNPMResult;
      if (!npmResult) {
        let url = this.npmAPIPackageURL + name.replace('/', '%2F');
        let response = await fetch(url, { timeout: FETCH_TIMEOUT });
        if (response.status !== 200) {
          this.app.log.warning(`Bad response from npm registry while fetching '${name}' package (HTTP status: ${response.status})`);
          return undefined;
        }
        npmResult = await response.json();
      }

      npmResult = new Package(npmResult);
      // I think this should be handled by nice-package:
      if (npmResult.repository && typeof npmResult.repository !== 'string') {
        npmResult.repository = npmResult.repository.url;
      }

      if (npmResult.name !== name) {
        this.app.log.warning(`Fetching '${name}' package returned a package with a different name (${npmResult.name})`);
        return undefined;
      }

      let keywords = npmResult.keywords;
      let readme = npmResult.readme;
      let version = npmResult.version;
      let lastPublisher = npmResult.lastPublisher;
      let license = npmResult.license;
      let reveal = npmResult.reveal;

      if (!npmResult.created) {
        this.app.log.warning(`Package '${name}' doesn't have a created date`);
        return undefined;
      }
      let createdOn = new Date(npmResult.created);

      if (!npmResult.modified) {
        this.app.log.warning(`Package '${name}' doesn't have an updated date`);
        return undefined;
      }
      let updatedOn = new Date(npmResult.modified);

      let npmURL = this.npmWebsitePackageURL + name;

      let gitHubResult, parsedGitHubURL, gitHubURL;
      if (npmResult.repository) {
        if (npmResult.repository.includes('github')) {
          parsedGitHubURL = parseGitHubURL(npmResult.repository);
          if (parsedGitHubURL) {
            gitHubURL = parsedGitHubURL.https_url;
            gitHubResult = await this.fetchGitHubRepository(parsedGitHubURL.user, parsedGitHubURL.repo);
          } else {
            this.app.log.debug(`'${name}' package has an invalid GitHub URL (${npmResult.repository})`);
          }
        } else {
          this.app.log.debug(`'${name}' package has a respository not hosted by GitHub (${npmResult.repository})`);
        }
      } else {
        this.app.log.debug(`'${name}' package doesn't have a respository field`);
      }

      let gitHubStars, gitHubPackageJSON, gitHubPackageJSONPath;
      if (gitHubResult) {
        const result = await this.getGitHubPackageJSON(name, parsedGitHubURL.user, parsedGitHubURL.repo, currentPackage && currentPackage.gitHubPackageJSONPath);
        if (result) {
          gitHubPackageJSON = result.pkg;
          gitHubPackageJSONPath = result.path;
          gitHubStars = gitHubResult.stargazers_count;
        }
      }

      let description = npmResult.description;
      if (description && gitHubPackageJSON && !gitHubPackageJSON.description) {
        // When the description is missing from package.json,
        // npm tries to generate one, but it is generally very bad,
        // so let's remove it!
        description = undefined;
        this.app.log.debug(`'Autogenerated description has been removed from ${name}' package`);
        await this.app.notifyOnce(`${name}-has-autogenerated-description`, `'${name}' package has an autogenerated description (${gitHubURL})`);
      }

      return {
        name,
        description,
        keywords,
        readme,
        version,
        lastPublisher,
        license,
        reveal,
        createdOn,
        updatedOn,
        npmURL,
        gitHubURL,
        gitHubStars,
        gitHubPackageJSON,
        gitHubPackageJSONPath,
        npmResult,
        gitHubResult
      };
    } catch (err) {
      this.app.log.warning(`An error occured while fetching '${name}' package from npm registry (${err.message})`);
      return undefined;
    }
  }

  async fetchGitHubRepository(gitHubUser, gitHubRepo) {
    try {
      let url = `${this.gitHubAPIURL}repos/${gitHubUser}/${gitHubRepo}`;
      return await this.requestGitHubAPI(url);
    } catch (err) {
      this.app.log.warning(`An error occured while fetching '${gitHubUser}/${gitHubRepo}' repository from GitHub API (${err.message})`);
      return undefined;
    }
  }

  async getGitHubPackageJSON(packageName, gitHubUser, gitHubRepo, previousPath) {
    try {
      const defaultPath = previousPath || 'package.json';
      let url = `${this.gitHubAPIURL}repos/${gitHubUser}/${gitHubRepo}/contents/${defaultPath}`;
      let pkg = await this.getGitHubJSONFile(url);
      if (pkg && pkg.name === packageName) return { pkg, path: defaultPath };

      // There is no correct package.json at the root of the repository,
      // let's try to find one in the rest of the repository
      this.app.log.debug(`Searching a correct package.json file for '${packageName}' package...`);
      url = `${this.gitHubAPIURL}repos/${gitHubUser}/${gitHubRepo}/git/trees/master?recursive=1`;
      let result = await this.requestGitHubAPI(url);
      if (!result) return undefined;
      if (result.truncated) {
        const message = `Result truncated while fetching GitHub tree for package '${packageName}'`;
        this.app.log.warning(message);
        this.app.notifier.notify(message);
      }
      let count = 0;
      for (const entry of result.tree) {
        if (entry.type !== 'blob') continue;
        const path = entry.path;
        if (path === defaultPath) continue; // Default path has already been fetched
        if (path.includes('node_modules/')) continue;
        if (!path.endsWith('/package.json')) continue;
        let pkg = await this.getGitHubJSONFile(entry.url);
        if (pkg && pkg.name === packageName) {
          this.app.log.debug(`Correct package.json file found for package '${packageName}' at ${path}`);
          return { pkg, path };
        }
        count++;
        if (count >= 30) {
          const message = `After fetching 30 package.json, no correct file found for '${packageName}' package`;
          this.app.log.warning(message);
          this.app.notifier.notify(message);
          return undefined;
        }
      }
      return undefined;
    } catch (err) {
      this.app.log.warning(`An error occured while fetching GitHub package.json file for package '${packageName}' (${err.message})`);
      return undefined;
    }
  }

  async getGitHubJSONFile(url) {
    let file = await this.requestGitHubAPI(url);
    if (!file) return false;
    if (file.encoding !== 'base64') {
      this.app.log.warning(`Unsupported GitHub file encoding found while fetching a file (${url}) from GitHub`);
      return undefined;
    }
    let json = file.content;
    json = new Buffer(json, 'base64').toString();
    try {
      let result = JSON.parse(json);
      return result;
    } catch (err) {
      this.app.log.debug(`An error occured while parsing JSON of a file (${url}) from GitHub (${err.message})`);
      return undefined;
    }
  }

  async getGitHubAPIRateLimit() {
    let url = `${this.gitHubAPIURL}rate_limit`;
    return await this.requestGitHubAPI(url);
  }

  async requestGitHubAPI(url) {
    this.app.log.debug(`Fetching GitHub API: ${url}`);
    let auth = this.gitHubUsername + ':' + this.gitHubPersonalAccessToken;
    auth = new Buffer(auth).toString('base64');
    while (true) {
      let response = await fetch(url, {
        headers: {
          Authorization: 'Basic ' + auth
        },
        timeout: FETCH_TIMEOUT
      });
      if (response.status === 200) {
        return await response.json();
      } else if (response.status === 404) {
        this.app.log.debug(`GitHub API returned a 404 Not Found status for '${url}' URL`);
        return undefined;
      } else if (response.status === 403) {
        if (!response.headers.has('X-RateLimit-Reset')) {
          this.app.log.warning(`Bad response from GitHub API while requesting '${url}' URL (HTTP status is 403 but 'X-RateLimit-Reset' header is missing)`);
          return undefined;
        }
        if (response.headers.get('X-RateLimit-Remaining') !== '0') {
          this.app.log.warning(`Bad response from GitHub API while requesting '${url}' URL (HTTP status is 403 but 'X-RateLimit-Remaining' header is ${response.headers.get('X-RateLimit-Remaining')})`);
          return undefined;
        }
        let resetTime = Number(response.headers.get('X-RateLimit-Reset')) * 1000;
        let waitTime = resetTime - Date.now() + 1000;
        if (waitTime <= 0) {
          this.app.log.debug(`Bad response from GitHub API while requesting '${url}' URL (HTTP status is 403 but 'X-RateLimit-Reset' is before current time)`);
          waitTime = 10000;
        }
        this.app.log.debug(`GitHub API limit reached, waiting ${waitTime / 1000} seconds...`);
        await sleep(waitTime);
      } else {
        this.app.log.warning(`Bad response from GitHub API while requesting '${url}' URL (HTTP status: ${response.status})`);
        return undefined;
      }
    }
  }
}

export default Fetcher;
