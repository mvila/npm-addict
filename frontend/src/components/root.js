'use strict';

import React from 'react';
import RadiumStarter from 'radium-starter';
import Page from './page';

const theme = {
  primaryColor: '#607D8B', // Material Design Blue Grey 500
  darkPrimaryColor: '#37474F', // Material Design Blue Grey 800
  accentColor: '#CB3837' // npm red
};

export class Root extends React.Component {
  static propTypes = {
    app: React.PropTypes.object.isRequired
  };

  static childContextTypes = {
    app: React.PropTypes.object
  };

  getChildContext() {
    return { app: this.props.app };
  }

  render() {
    return (
      <RadiumStarter theme={theme}>
        <Page />
      </RadiumStarter>
    );
  }
}

export default Root;
