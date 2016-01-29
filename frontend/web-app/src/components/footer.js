'use strict';

import Radium from 'radium';
import React from 'react';
import s from '../styles';

@Radium
export class Footer extends React.Component {
  render() {
    return (
      <footer style={[s.mb2, s.center, { lineHeight: 1 }]}>
        <small style={[s.fs6, s.grayDarker]}>
          Crafted in Japan by <a href='https://github.com/mvila'>Manuel Vila</a>
        </small>
      </footer>
    );
  }
}

export default Footer;
