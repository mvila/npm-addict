'use strict';

import React from 'react';
import Common from './common';

@Common
export class Sunset extends React.Component {
  static propTypes = {
    style: React.PropTypes.oneOfType([
      React.PropTypes.object,
      React.PropTypes.array
    ])
  };

  render() {
    return (
      <div style={this.props.style}>
        <h4>Sayonara 👋</h4>

        <hr />

        <p>It's been a great ride, but it's time to say goodbye. <a href='#'>npm addict</a> will be sunsetting on <strong>May 31st, 2023</strong>.</p>

        <p>The project began seven years ago and, unfortunately, has not undergone significant improvements since then. As a result, it has incurred numerous technical debts.</p>

        <p>Also, the operation cost has been rising gradually due to the significant increase in the number of npm packages released daily. Just to provide some insight, the database currently contains 67 GB of data, and the overall expense of hosting is roughly $100 per month.</p>

        <p>Regrettably, I cannot allocate sufficient time to address the technical debts or explore options to cover the expenses associated with hosting.</p>
        
        <p>Therefore, I've decided to close <a href='#'>npm addict</a> and genuinely apologize to the few people who use it.</p>
        
        <p>I still dedicate a significant portion of my time to working on open-source projects. For those who are interested, you can take a look at:</p>

        <ul>
          <li><a href='https://www.1place.app/' target='_blank'>1Place</a></li>
          <li><a href='https://layrjs.com/' target='_blank'>Layr</a></li>
          <li><a href='https://boostr.dev/' target='_blank'>Boostr</a></li>
          <li><a href='https://deepr.io/' target='_blank'>Deepr</a></li>
        </ul>

        <p>I want to express my gratitude to all the individuals who have generously provided their assistance to me throughout the years. Thank you very much. 🙏</p>

        <p>Happy coding,<br />Manuel Vila</p>
      </div>
    );
  }
}

export default Sunset;
