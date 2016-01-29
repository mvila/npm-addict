'use strict';

import Radium from 'radium';
import React from 'react';
import s from '../styles';

@Radium
export class FAQ extends React.Component {
  render() {
    return (
      <div style={[s.p2, s.bgWhite, s.border, s.rounded, this.props.style]}>
        FAQ
      </div>
    );
  }
}

export default FAQ;
