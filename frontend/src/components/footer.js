'use strict';

import React from 'react';
import Common from './common';

@Common
export class Footer extends React.Component {
  render() {
    const separator = <span style={{ marginLeft: '0.5rem', marginRight: '0.5rem', color: this.theme.borderColor }}>|</span>;
    return (
      <footer style={{ flexShrink: 0, textAlign: 'center', fontSize: this.theme.smallFontSize }}>
        <div>
          <a href={'#/feeds'}>RSS feeds</a>
          {/* {separator}
          <a href='https://twitter.com/npmaddict'>Twitter</a> */}
          {separator}
          <a href='https://github.com/mvila/npm-addict'>GitHub</a>
        </div>
        <div>
          <small>Crafted in Japan by <a href='https://github.com/mvila'>Manuel Vila</a></small>
        </div>
      </footer>
    );
  }
}

export default Footer;
