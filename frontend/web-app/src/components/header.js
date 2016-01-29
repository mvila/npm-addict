'use strict';

import Radium from 'radium';
import React from 'react';
import s from '../styles';
import MainMenu from './main-menu';

@Radium
export class Header extends React.Component {
  render() {
    return (
      <header style={[s.flex, s.flexCenter, s.pl15, s.pr2, s.py15, s.borderBottom]}>
        <a href='#/' style={{ lineHeight: 0 }}>
          <img src='images/npm-addict-logo-and-tagline.svg' alt='npm addict - Your daily injection of npm packages' />
        </a>
        <div style={s.flexAuto} />
        <MainMenu />
      </header>
    );
  }
}

export default Header;
