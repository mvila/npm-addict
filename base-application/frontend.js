'use strict';

import BaseApplication from './';

export class BaseFrontendApplication extends BaseApplication {
  constructor(options) {
    super(options);

    window.addEventListener('error', err => {
      this.log.error(err);
    }, false);
  }
}

export default BaseFrontendApplication;
