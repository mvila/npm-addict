'use strict';

import React from 'react';
import Common from './common';

@Common
export class Banner extends React.Component {
  render() {
    const t = this.theme;

    return (
      <div style={{ flexShrink: 0, padding: '.75rem', color: t.bodyColor, backgroundColor: t.accentColor, textAlign: 'center' }}>
        <strong>npm addict</strong> will be sunsetting on <strong>May 31st, 2023</strong>. <a href='#/sunset' style={{ color: t.bodyColor, textDecoration: t.hoveredLinkDecoration }}>Find out more</a>.
      </div>
    );
  }
}

export default Banner;
