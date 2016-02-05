'use strict';

import Radium from 'radium';
import React from 'react';
import moment from 'moment';
import s from '../styles';
import PackageItem from './package-item';

@Radium
export class PackageList extends React.Component {
  static contextTypes = {
    app: React.PropTypes.object
  };

  render() {
    let currentDate = this.context.app.currentDate;

    let { date, items } = this.props;

    let displayDate;
    if (!currentDate) {
      if (moment(date).isSame(moment(), 'day')) {
        displayDate = 'Today';
      } else if (moment(date).isSame(moment().subtract(1, 'days'), 'day')) {
        displayDate = 'Yesterday';
      } else {
        displayDate = moment(date).format('MMMM Do');
      }
    } else {
      displayDate = moment.utc(date).format('MMMM Do');
    }

    return (
      <div style={[s.mt225, s.mb25]}>
        <div style={[s.inlineBlock, s.mb05, s.px075, s.py05, s.fs5, s.caps, s.bold, s.white, s.bgGray, { lineHeight: 1 }]}>
          {displayDate}
        </div>
        <ul style={[s.listReset]}>
          {
            items.map(item => <PackageItem key={item.id} item={item} />)
          }
        </ul>
      </div>
    );
  }
}

export default PackageList;
