'use strict';

import EventEmitterMixin from 'event-emitter-mixin';
import UniversalLog from 'universal-log';
import fetch from 'isomorphic-fetch';
import { LocalStore, model, Model, primaryKey, field, createdOn, updatedOn } from 'object-layer';
let pkg = require('../package.json');

class Package extends Model {
  @primaryKey() id;
  @field(String) name;
  @field(String) description;
  @createdOn() createdOn;
  @updatedOn() updatedOn;
}

class Store extends LocalStore {
  @model(Package) Package;
}

class Application extends EventEmitterMixin() {
  constructor({ name, displayName, version } = {}) {
    super();

    this.name = name || pkg.name;
    this.displayName = displayName || pkg.displayName || pkg.name;
    this.version = version || pkg.version;

    this.log = new UniversalLog({ appName: this.name });

    this.store = new Store({
      context: this,
      name: '1PlaceNPMIntegration',
      url: 'mysql://root:secret@localhost/1place'
    });

    this.npmUpdatedPackagesURL = 'http://registry.npmjs.org/-/_view/browseUpdated?group_level=2';
    this.npmPackageURL = 'http://registry.npmjs.org/';
  }

  async run() {
    let lastDate = new Date('2016-01-22T09:03:15.000Z');
    let startKey = [lastDate];
    let url = this.npmBrowseUpdatedURL;
    url += '&startkey=' + encodeURIComponent(JSON.stringify(startKey));
    let response = await fetch(url);
    if (response.status !== 200) {
      throw new Error('Bad response from npm registry server');
    }
    let result = await response.json();
    let packages = result.rows;
    console.log(packages);
  }
}

let app = new Application();

app.run().catch(app.log.error);
