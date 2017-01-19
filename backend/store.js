'use strict';

import { LocalStore, model } from 'object-layer';
import { BackendState } from '../models/backend-state';
import { Package } from '../models/package';
import { IgnoredPackage } from '../models/ignored-package';
import { Post } from '../models/post';
import { Notification } from '../models/notification';

export class Store extends LocalStore {
  @model(BackendState) BackendState;
  @model(Package, {
    indexes: ['name', ['revealed', 'revealedOn']]
  }) Package;
  @model(IgnoredPackage, { indexes: ['name'] }) IgnoredPackage;
  @model(Post, { indexes: ['createdOn'] }) Post;
  @model(Notification, { indexes: ['name'] }) Notification;
}

export default Store;
