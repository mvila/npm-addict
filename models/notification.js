'use strict';

import { Model, primaryKey, field, createdOn, updatedOn } from 'object-layer/lib/model';

export class Notification extends Model {
  @primaryKey() id;
  @field(String, { validators: 'filled' }) name;
  @field(String, { validators: 'filled' }) message;
  @createdOn() createdOn;
  @updatedOn() updatedOn;

  static async hasName(name) {
    let count = await this.count({ query: { name } });
    return count > 0;
  }
}

export default Notification;
