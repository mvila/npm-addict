'use strict';

import { Model, primaryKey, field, createdOn, updatedOn } from 'object-layer';

export class Package extends Model {
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
    if (!this.description) {
      if (log) {
        log.info(`'${this.name}' package doesn't have a description`);
      }
      return false;
    }

    let reveal = this.getRevealProperty();
    if (reveal != null) {
      if (log) {
        log.notice(`'${this.name}' package has a reveal property set to ${reveal ? 'true' : 'false'}`);
      }
      return reveal;
    }

    let verification = this.verifyGitHubRepositoryOwnership();
    if (verification === false) {
      if (log) {
        log.info(`'${this.name}' package has a GitHub repository but the ownership verification failed`);
      }
      return false;
    }

    let gitHubStars = this.getGitHubStars();
    if (gitHubStars == null) return false;
    if (gitHubStars >= 3) return true;
    if (log) {
      log.info(`'${this.name}' package has not enough stars (${gitHubStars} of 3)`);
    }

    return false;
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
