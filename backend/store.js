'use strict';

import { LocalStore, model } from 'object-layer';
import { BackendState } from '../models/backend-state';
import { Package } from '../models/package';
import { IgnoredPackage } from '../models/ignored-package';

export class Store extends LocalStore {
  @model(BackendState) BackendState;
  @model(Package, {
    indexes: ['name', ['visible', 'itemCreatedOn']]
  }) Package;
  @model(IgnoredPackage, { indexes: ['name'] }) IgnoredPackage;
}

export default Store;
