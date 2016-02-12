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
      <header style={[s.flex, s.flexCenter, s.pl15, s.pr2, s.py15, s.borderBottom]}>
        <a href='#/' style={{ lineHeight: 0 }} title={`v${this.context.app.version}`}>
          <img src='images/npm-addict-logo-and-tagline.svg' alt={`${this.context.app.displayName} - ${this.context.app.description}`} style={[s.smShow]} />
          <img src='images/npm-addict-logo.svg' alt={this.context.app.displayName} style={[s.smHide]} />
        </a>
        <div style={s.flexAuto} />
        <MainMenu />
      </header>
    );
  }
}

export default Header;
