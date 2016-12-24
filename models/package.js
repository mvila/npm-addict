'use strict';

import { Model, primaryKey, field, createdOn, updatedOn } from 'object-layer/lib/model';
import hasChinese from 'has-chinese';

export class Package extends Model {
  @primaryKey() id;
  @field(String, { validators: 'filled' }) name;
  @field(String) description;
  @field(String) npmURL;
  @field(String) gitHubURL;
  @field(Boolean) visible;
  @field(Boolean) forced;
  @field(Date, { validators: 'filled' }) createdOn;
  @field(Date, { validators: 'filled' }) updatedOn;
  @field(Object) npmResult;
  @field(Object) gitHubResult;
  @field(Object) gitHubPackageJSON;
  @createdOn() itemCreatedOn;
  @updatedOn() itemUpdatedOn;

  static async getByName(name) {
    let packages = await this.find({ query: { name }, limit: 1 });
    return packages[0];
  }

  get formattedDescription() {
    let description = this.description;
    if (!description) return '';
    description = description.trim();
    description = description.charAt(0).toUpperCase() + description.substr(1);
    let lastChar = description.substr(-1);
    if (lastChar !== '.' && lastChar !== '!' && lastChar !== '?') {
      description += '.';
    }
    return description;
  }

  get bestURL() {
    return this.gitHubURL || this.npmURL;
  }

  determineVisibility(log) {
    if (this.forced) return true;

    if (!this.description) {
      if (log) {
        log.info(`'${this.name}' package doesn't have a description`);
      }
      return false;
    }

    let verification = this.verifyGitHubRepositoryOwnership();
    if (verification === false) {
      if (log) {
        log.info(`'${this.name}' package has a GitHub repository but the ownership verification failed`);
      }
      return false;
    }

    let reveal = this.getRevealProperty();
    if (reveal != null) {
      if (log) {
        let message = `'${this.name}' package has a reveal property set to ${reveal ? 'true' : 'false'}`;
        log.notice(message);
        if (this.isNew && reveal) this.context.notifier.notify(message);
      }
      return reveal;
    }

    let gitHubStars = this.getGitHubStars();
    if (gitHubStars == null) return false;
    if (gitHubStars < this.context.minimumGitHubStars) {
      if (log) {
        log.info(`'${this.name}' package has not enough stars (${gitHubStars} of ${this.context.minimumGitHubStars})`);
      }
      return false;
    }

    let readme = this.npmResult.readme;
    if (!readme) {
      if (log) {
        log.info(`'${this.name}' package doesn't have a README`);
      }
      return false;
    }

    if (hasChinese(readme)) {
      // I am very sorry Chinese guys, you must document your package in English
      // to be listed on npm addict
      if (log) {
        log.info(`'${this.name}' package contains Chinese characters`);
        // this.context.notifier.notify(`'${this.name}' package contains Chinese characters (${this.npmURL})`);
      }
      return false;
    }

    return true;
  }

  getRevealProperty() {
    let pkg = this.npmResult;
    let latestVersion = pkg['dist-tags'] && pkg['dist-tags'].latest;
    if (!latestVersion) return undefined;
    pkg = pkg.versions && pkg.versions[latestVersion];
    if (!pkg) return undefined;
    return pkg.reveal;
  }

  getGitHubStars() {
    return this.gitHubResult && this.gitHubResult.stargazers_count;
  }

  verifyGitHubRepositoryOwnership() {
    if (!this.gitHubResult) return undefined;
    if (!this.gitHubPackageJSON) return false;
    return this.gitHubPackageJSON.name === this.name;
  }
}

export default Package;
