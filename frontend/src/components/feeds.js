'use strict';

import React from 'react';
import Common from './common';

@Common
export class Feeds extends React.Component {
  static propTypes = {
    style: React.PropTypes.oneOfType([
      React.PropTypes.object,
      React.PropTypes.array
    ])
  };

  render() {
    const dailyFeedURL = this.app.apiURL + 'feeds/daily';
    const realTimeFeedURL = this.app.apiURL + 'feeds/real-time';

    return (
      <div style={this.props.style}>
        <h4>RSS feeds</h4>

        <hr />

        <h5>Daily feed</h5>
        <p>
          One post per day:<br />
          <a href={dailyFeedURL} style={{ wordWrap: 'break-word' }}>{dailyFeedURL}</a>
        </p>

        <h5>Real-time feed</h5>
        <p>
          One post for every new package:<br />
        <a href={realTimeFeedURL} style={{ wordWrap: 'break-word' }}>{realTimeFeedURL}</a>
        </p>
      </div>
    );
  }
}

export default Feeds;
