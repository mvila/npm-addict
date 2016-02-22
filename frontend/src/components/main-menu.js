'use strict';

import React from 'react';
import Common from './common';

@Common
export class MainMenu extends React.Component {
  render() {
    return (
      <ul style={[this.styles.unstyledList, this.styles.noMargins]}>
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
