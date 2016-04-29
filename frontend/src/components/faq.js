'use strict';

import React from 'react';
import Common from './common';

@Common
export class FAQ extends React.Component {
  static propTypes = {
    style: React.PropTypes.oneOfType([
      React.PropTypes.object,
      React.PropTypes.array
    ])
  };

  render() {
    return (
      <div style={this.props.style}>
        <h4>FAQ</h4>

        <hr />

        <h5>Why was this website created?</h5>
        <p>There are tons of awesome packages in the npm registry. Unfortunately, they are difficult to search for and it is almost impossible to stumble upon them if they don't belong to a trending category or the author is unknown. This website lists (almost) every packages created, check it every day so you don't miss anything.</p>

        <h5>How many new packages are published every day?</h5>
        <p>After filtering (see below), an average of 20 packages are published every day. It is then perfectly readable, and believe me, it's worth it! :)</p>

        <h5>How packages are filtered?</h5>
        <p>A large majority of packages (more than 2 out of 3) are published in the npm registry when they are not ready to be unveiled. How to filter them? I believe it should be the responsibility of each author to indicate whether or not a package should be exposed to the community. Unfortunately, there is no official property in the <code>package.json</code> file to indicate that. We can define and agree on such a property and I am trying to push in this direction with the <code>reveal</code> property (see below).</p>
        <p>Anyway,  the adoption will take time, so until then I filter the packages based on the number of GitHub stars. A minimum of {this.app.minimumGitHubStars} stars is required for a package to be referenced. I know it's not perfect, all packages are not hosted by GitHub, but it's a start.</p>

        <h5>What is the <code>reveal</code> property?</h5>
        <p>Simple, if you want your package to appear on npm addict (regardless of the number of GitHub stars it has), add the <code>reveal</code> property in your <code>package.json</code> file with a value set to <code>true</code>.</p>
        <p>If you don't want your package to be listed, you can opt-out by setting the property to <code>false</code>.</p>
        <p>My hope about this <code>reveal</code> property is that it will be accepted by the JS community and can be used by other websites, including (let's dream) the official <a href='https://www.npmjs.com/' target='_blank'> npm site</a>!</p>
      </div>
    );
  }
}

export default FAQ;
