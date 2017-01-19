'use strict';

import React from 'react';
import RadiumStarter from 'radium-starter';

export function Common(component) {
  if (!component.contextTypes) component.contextTypes = {};
  component.contextTypes.app = React.PropTypes.object.isRequired;

  const originalComponentWillMount = component.prototype.componentWillMount;
  component.prototype.componentWillMount = function() {
    this.app = this.context.app;
    if (originalComponentWillMount) originalComponentWillMount.call(this);
  };

  return RadiumStarter(component);
}

export default Common;
