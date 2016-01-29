'use strict';

import { Model, primaryKey, field, createdOn, updatedOn } from 'object-layer';

export class IgnoredPackage extends Model {
  @primaryKey() id;
  @field(String, { validators: 'filled' }) name;
  @field(String) reason;
  @createdOn() createdOn;
  @updatedOn() updatedOn;

  static async getByName(name) {
    let ignoredPackages = await this.find({ query: { name }, limit: 1 });
    return ignoredPackages[0];
  }
}

export default IgnoredPackage;
