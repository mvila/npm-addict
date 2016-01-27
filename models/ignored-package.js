'use strict';

import { Model, primaryKey, field, createdOn, updatedOn } from 'object-layer';

export class IgnoredPackage extends Model {
  @primaryKey() id;
  @field(String, { validators: 'filled' }) name;
  @field(String) reason;
  @createdOn() createdOn;
  @updatedOn() updatedOn;
}

export default IgnoredPackage;
