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

  determineVisibility(log) {
    if (!this.description) {
      if (log) {
        log.info(`'${this.name}' package doesn't have a description`);
      }
      return false;
    }

    let promote = this.getPromoteProperty();
    if (promote != null) {
      if (log) {
        log.notice(`'${this.name}' package has a promote property set to ${promote ? 'true' : 'false'}`);
      }
      return promote;
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

  verifyGitHubRepositoryOwnership() {
    if (!this.gitHubResult) return undefined;
    if (!this.gitHubPackageJSON) return false;
    return this.gitHubPackageJSON.name === this.name;
  }
}

export default Package;
