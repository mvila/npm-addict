'use strict';

import Radium from 'radium';
import React from 'react';
import s from '../styles';

@Radium
export class MainMenu extends React.Component {
  render() {
    return (
      <ul style={[s.listReset, s.m0]}>
        <li style={[s.inlineBlock, s.ml2]}>
          <a href='#/faq'>
            FAQ
          </a>
        </li>
        <li style={[s.inlineBlock, s.ml2]}>
          <a href='https://github.com/mvila/npm-addict/issues'>
            Support
          </a>
        </li>
      </ul>
    );
  }
}

export default MainMenu;
