'use strict';

import Radium from 'radium';
import React from 'react';
import s from '../styles';

@Radium
export class PackageItem extends React.Component {
  render() {
    let { item } = this.props;

    return (
      <li style={[s.mt1]}>
        <div style={[s.bold]}><a href={item.url} style={[]}>{item.name}</a></div>
        <div>{item.description}</div>
      </li>
    );
  }
}

export default PackageItem;
