'use strict';

import Radium from 'radium';
import React from 'react';
import s from '../styles';

@Radium
export class MainMenu extends React.Component {
  render() {
    return (
      <ul style={[s.unstyledList, s.noMargins]}>
        <li style={[{ display: 'inline-block', marginLeft: '1rem' }]}>
          <a href='#/faq'>
            FAQ
          </a>
        </li>
        <li style={[{ display: 'inline-block', marginLeft: '1rem' }]}>
          <a href='https://github.com/mvila/npm-addict/issues'>
            Support
          </a>
        </li>
      </ul>
    );
  }
}

export default MainMenu;
