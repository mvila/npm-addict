'use strict';

import React from 'react';
import Common from './common';
import MainMenu from './main-menu';

@Common
export class Header extends React.Component {
  render() {
    return (
      <header style={[{ flexShrink: 0, display: 'flex', alignItems: 'center', padding: '.85rem 1rem .75rem .75rem' }, this.styles.bottomBorder]}>
        <a href='#/' title={`v${this.app.version}`}>
          <img src='images/npm-addict-logo-and-tagline.svg' alt={`${this.app.displayName} - ${this.app.description}`} style={[this.styles.hideIfSmall]} />
          <img src='images/npm-addict-logo.svg' alt={this.app.displayName} style={[this.styles.showIfSmall]} />
        </a>
        <div style={[{ flexGrow: 1 }]} />
        <MainMenu />
      </header>
    );
  }
}

export default Header;
