'use strict';

import React from 'react';
import moment from 'moment';
import Common from './common';
import PackageItem from './package-item';

@Common
export class PackageList extends React.Component {
  static propTypes = {
    date: React.PropTypes.instanceOf(Date).isRequired,
    items: React.PropTypes.array.isRequired
  };

  render() {
    let t = this.theme;
    let s = this.styles;

    let currentDate = this.app.currentDate;

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
      <div style={{ marginBottom: '.75rem' }}>
        <div style={[{ display: 'inline-block', marginBottom: '.75rem', padding: '.25rem .375rem', lineHeight: 1, fontSize: t.smallFontSize, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.1em' }, s.inversePrimaryTextColor, s.backgroundPrimaryColor]}>
          {displayDate}
        </div>
        <ul style={[s.unstyledList, s.noMargins]}>
          {
            items.map(item => <PackageItem key={item.id} item={item} />)
          }
        </ul>
      </div>
    );
  }
}

export default PackageList;
