'use strict';

import Radium from 'radium';
import React from 'react';
import s from '../styles';

@Radium
export class Footer extends React.Component {
  render() {
    return (
      <footer style={[s.mb2, s.center, s.fs5, s.grayDarker, this.props.style]}>
        <div>
          <a href={'#/feeds'}>RSS Feeds</a><span style={[s.ml1, s.mr1, s.grayLight]}>|</span><a href='https://twitter.com/npmaddict'>Twitter</a>
        </div>
        <div style={[s.mt05]}>
          <span style={[s.fs6]}>Crafted in Japan by <a href='https://github.com/mvila'>Manuel Vila</a></span>
        </div>
      </footer>
    );
  }
}

export default Footer;
