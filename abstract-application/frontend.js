'use strict';

import AbstractApplication from './';

export class AbstractFrontendApplication extends AbstractApplication {
  constructor(options) {
    super(options);

    window.addEventListener('error', err => {
      this.log.error(err);
    }, false);
  }
}

export default AbstractFrontendApplication;
