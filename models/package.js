'use strict';

import { Model, primaryKey, field, createdOn, updatedOn } from 'object-layer/lib/model';
import hasChinese from 'has-chinese';

export class Package extends Model {
  @primaryKey() id;
  @field(String, { validators: 'filled' }) name;
  @field(String) description;
  @field(Array) keywords;
  @field(String) readme;
  @field(String) version;
  @field(Object) lastPublisher;
  @field(String) license;
  @field(Boolean) reveal;
  @field(Date, { validators: 'filled' }) createdOn;
  @field(Date, { validators: 'filled' }) updatedOn;
  @field(String) npmURL;
  @field(String) gitHubURL;
  @field(Number) gitHubStars;
  @field(Object) gitHubPackageJSON;
  @field(Boolean) visible; // DEPRECATED
  @field(Boolean) forced; // DEPRECATED
  @field(Boolean) revealed;
  @field(Date) revealedOn;
  @field(Object) npmResult;
  @field(Object) gitHubResult;
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

  determineRevealed() {
    let log = this.context.log;
    let notifier = this.context.notifier;

    if (!this.createdOn) {
      log.info(`'${this.name}' package doesn't have a creation date`);
      return false;
    }

    let minimumDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000); // 6 months
    if (this.createdOn < minimumDate) {
      log.info(`'${this.name}' package was created too long ago (creation date: ${this.createdOn.toISOString()})`);
      return false;
    }

    if (!this.description) {
      log.info(`'${this.name}' package doesn't have a description`);
      return false;
    }

    if (this.reveal != null) {
      let message = `'${this.name}' package has a reveal property set to ${this.reveal ? 'true' : 'false'}`;
      log.notice(message);
      notifier.notify(message);
      return this.reveal;
    }

    if (this.gitHubStars == null) return false;
    if (this.gitHubStars < this.context.minimumGitHubStars) {
      log.info(`'${this.name}' package has not enough stars (${this.gitHubStars} of ${this.context.minimumGitHubStars})`);
      return false;
    }

    let readme = this.npmResult.readme;
    if (!readme) {
      log.info(`'${this.name}' package doesn't have a README`);
      return false;
    }

    if (hasChinese(readme)) {
      // I am very sorry Chinese guys, you must document your package in English
      // to be listed on npm addict
      log.info(`'${this.name}' package contains Chinese characters`);
      // notifier.notify(`'${this.name}' package contains Chinese characters (${this.npmURL})`);
      return false;
    }

    return true;
  }
}

export default Package;
