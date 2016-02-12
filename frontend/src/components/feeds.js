'use strict';

import Radium from 'radium';
import React from 'react';
import s from '../styles';

@Radium
export class Feeds extends React.Component {
  static contextTypes = {
    app: React.PropTypes.object
  };

  render() {
    let dailyFeedURL = this.context.app.apiURL + 'feeds/daily';
    let realTimeFeedURL = this.context.app.apiURL + 'feeds/real-time';

    return (
      <div style={[s.p2, s.bgWhite, s.border, s.rounded, this.props.style]}>
        <h2 style={[s.mt0, s.mb1, s.grayDarker, { lineHeight: 1 }]}>RSS Feeds</h2>

        <hr style={[s.mt25, s.mb2, s.smShow]} />

        <h3>Daily feed</h3>
        <p>
          One post per day:<br />
          <a href={dailyFeedURL} style={{ wordWrap: 'break-word' }}>{dailyFeedURL}</a>
        </p>

        <h3>Real-time feed</h3>
        <p>
          One post for every new package:<br />
        <a href={realTimeFeedURL} style={{ wordWrap: 'break-word' }}>{realTimeFeedURL}</a>
        </p>
      </div>
    );
  }
}

export default Feeds;
