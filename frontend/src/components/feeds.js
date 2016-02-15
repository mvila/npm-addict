'use strict';

import Radium from 'radium';
import React from 'react';

@Radium
export class Feeds extends React.Component {
  static contextTypes = {
    app: React.PropTypes.object
  };

  render() {
    let dailyFeedURL = this.context.app.apiURL + 'feeds/daily';
    let realTimeFeedURL = this.context.app.apiURL + 'feeds/real-time';

    return (
      <div style={this.props.style}>
        <h4>RSS Feeds</h4>

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
