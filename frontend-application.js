'use strict';

require('autotrack');
import BaseApplication from './base-application';

export class FrontendApplication extends BaseApplication {
  constructor(options) {
    super(options);

    window.addEventListener('error', err => {
      this.log.error(err);
    }, false);
  }
}

export default FrontendApplication;
