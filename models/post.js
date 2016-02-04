'use strict';

import { Model, primaryKey, field, createdOn, updatedOn } from 'object-layer';

export class Post extends Model {
  @primaryKey() id;
  @field(String, { validators: 'filled' }) title;
  @field(String, { validators: 'filled' }) content;
  @field(String, { validators: 'filled' }) url;
  @createdOn() createdOn;
  @updatedOn() updatedOn;
}

export default Post;
