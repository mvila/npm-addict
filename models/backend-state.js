'use strict';

import { Model, primaryKey, field, createdOn, updatedOn } from 'object-layer';

export class BackendState extends Model {
  @primaryKey(String, { defaultValue: 'BackendState' }) id;
  @field(Date, {
    defaultValue: () => new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours
  }) minimumCreationDate;
  @field(Date, {
    defaultValue: () => new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours
  }) lastModificationDate;
  @field(Date) lastFetchDate;
  @field(Date) lastDailyFeedPostDate;
  @createdOn() createdOn;
  @updatedOn() updatedOn;
}

export default BackendState;
