'use strict';

import React from 'react';
import Common from './common';

const MINI_ICON_STYLE = {
  verticalAlign: '-2px',
  opacity: 0.4,
  ':hover': {
    opacity: 1
  }
};

@Common
export class PackageItem extends React.Component {
  static propTypes = {
    item: React.PropTypes.object.isRequired
  };

  render() {
    let { item } = this.props;

    return (
      <li key='line' style={[{ marginBottom: '.5rem', wordWrap: 'break-word', ':hover': {} }]}>
        <div>
          <a href={item.bestURL} target='_blank' style={[this.styles.bold]}>{item.name}</a>
          {
            this.Radium.getState(this.state, 'line', ':hover') ?
            <span>
              <a href={item.npmURL} target='_blank'><img key='npmLink' src='images/npm-logo-black.png' alt='npm' width='15' height='15' style={[{ marginLeft: 12 }, MINI_ICON_STYLE]} /></a>
              <a href={item.gitHubURL} target='_blank'><img key='gitHubLink' src='images/github-logo-black.png' alt='GitHub' width='16' height='16' style={[{ marginLeft: 8 }, MINI_ICON_STYLE]} /></a>
            </span> :
            null
          }
        </div>
        <div>
          {item.formattedDescription}
        </div>
      </li>
    );
  }
}

export default PackageItem;
