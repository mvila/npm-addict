'use strict';

import { Model, primaryKey, field, createdOn, updatedOn } from 'object-layer/lib/model';

export class BackendState extends Model {
  @primaryKey(String, { defaultValue: 'BackendState' }) id;
  @field(Number, { defaultValue: 1 }) version;
  @field(Number) lastRegistryUpdateSeq;
  @field(Date) lastUpdateDate;
  @field(Date) lastDailyFeedPostDate;
  @createdOn() createdOn;
  @updatedOn() updatedOn;
}

export default BackendState;
