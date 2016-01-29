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
  @createdOn() itemCreatedOn;
  @updatedOn() itemUpdatedOn;

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

export default Package;
