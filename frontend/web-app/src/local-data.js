'use strict';

import EventEmitterMixin from 'event-emitter-mixin';
import { jsonLocalStorage } from 'json-web-storage';

let VERSION = 1;

export class LocalData extends EventEmitterMixin() {
  constructor() {
    super();
    
    let version = jsonLocalStorage.getItem('version') || 0;

    if (version === VERSION) return;

    // Downgrade ?

    if (version > VERSION) {
      // in case of semantic change, delete every known settings
      version = 0;
      jsonLocalStorage.removeItem('version');
    }

    // Upgrade ?

    if (version < 1) {
      // ...
    }

    jsonLocalStorage.setItem('version', VERSION);
  }

  get clientId() {
    return jsonLocalStorage.getItem('clientId') || undefined;
  }
  set clientId(id) {
    if (id) {
      jsonLocalStorage.setItem('clientId', id);
    } else {
      jsonLocalStorage.removeItem('clientId');
    }
    this.emit('clientId.didChange');
  }
}

export default LocalData;
