'use strict';

import React from 'react';
import Radium from 'radium';

export function Common(component) {
  if (!component.contextTypes) component.contextTypes = {};
  component.contextTypes.app = React.PropTypes.object.isRequired;
  component.contextTypes.theme = React.PropTypes.object.isRequired;
  component.contextTypes.styles = React.PropTypes.object.isRequired;

  let originalComponentWillMount = component.prototype.componentWillMount;
  component.prototype.componentWillMount = function() {
    this.Radium = Radium;
    this.app = this.context.app;
    this.theme = this.context.theme;
    this.styles = this.context.styles;
    if (originalComponentWillMount) originalComponentWillMount.call(this);
  };

  return Radium()(component);
}

export default Common;
