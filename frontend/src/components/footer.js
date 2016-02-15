'use strict';

import Radium from 'radium';
import React from 'react';
import { variables as v } from '../styles';

@Radium
export class Footer extends React.Component {
  render() {
    let separator = <span style={{ marginLeft: '0.5rem', marginRight: '0.5rem', color: v.lightGray }}>|</span>;
    return (
      <footer style={{ textAlign: 'center', fontSize: v.smallFontSize }}>
        <div>
          <a href={'#/feeds'}>RSS Feeds</a>
          {separator}
          <a href='https://twitter.com/npmaddict'>Twitter</a>
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
