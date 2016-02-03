'use strict';

import EventEmitterMixin from 'event-emitter-mixin';
let environment = require('better-node-env');
import UniversalLog from 'universal-log';
import EasyNotifier from 'easy-notifier';
let pkg = require('../package.json');

export class BaseApplication extends EventEmitterMixin() {
  constructor({ name, displayName, description, version } = {}) {
    super();

    this.name = name || pkg.name;
    this.displayName = displayName || pkg.displayName;
    this.description = description || pkg.description;
    this.version = version || pkg.version;
    this.projectName = pkg.name;

    this.environment = environment;

    let options = { appName: this.name, muteLevels: ['silence'] };
    if (this.environment !== 'development') options.muteLevels.push('trace');
    this.log = new UniversalLog(options);

    this.notifier = new EasyNotifier({ appName: this.name });

    switch (this.environment) {
      case 'development':
        this.apiURL = 'http://api.dev.npmaddict.com:20576/v1/';
        this.frontendURL = 'http://dev.npmaddict.com:20576/';
        break;
      case 'test':
        this.apiURL = 'https://api.test.npmaddict.com/v1/';
        this.frontendURL = 'https://test.npmaddict.com/';
        break;
      case 'production':
        this.apiURL = 'https://api.npmaddict.com/v1/';
        this.frontendURL = 'https://npmaddict.com/';
        break;
      default:
        throw new Error(`Unknown environment ('${this.environment}')`);
    }
  }
}

export default BaseApplication;
