'use strict';

import Radium from 'radium';
import React from 'react';
import s from '../styles';
import MainMenu from './main-menu';

@Radium
export class Header extends React.Component {
  static contextTypes = {
    app: React.PropTypes.object
  };

  render() {
    return (
      <header style={[{ display: 'flex', alignItems: 'center', padding: '.85rem 1rem .75rem .75rem' }, s.bottomBorder]}>
        <a href='#/' title={`v${this.context.app.version}`}>
          <img src='images/npm-addict-logo-and-tagline.svg' alt={`${this.context.app.displayName} - ${this.context.app.description}`} style={[s.hiddenIfSmall]} />
          <img src='images/npm-addict-logo.svg' alt={this.context.app.displayName} style={[s.shownIfSmall]} />
        </a>
        <div style={[{ flexGrow: 1 }]} />
        <MainMenu />
      </header>
    );
  }
}

export default Header;
