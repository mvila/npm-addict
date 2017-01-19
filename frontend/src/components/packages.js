'use strict';

import React from 'react';
import moment from 'moment';
import { Button } from 'radium-starter';
import Common from './common';
import PackageList from './package-list';

@Common
export class Packages extends React.Component {
  static propTypes = {
    style: React.PropTypes.oneOfType([
      React.PropTypes.object,
      React.PropTypes.array
    ])
  };

  componentWillMount() {
    this.handleAppDidChange = () => this.forceUpdate();
    this.app.on('didChange', this.handleAppDidChange);

    this.handleBeforeUnload = () => {
      window.history.replaceState({ scrollY: window.scrollY }, null);
    };
    window.addEventListener('beforeunload', this.handleBeforeUnload, false);
  }

  componentDidMount() {
    if (window.history.state && window.history.state.scrollY) {
      window.scroll(0, window.history.state.scrollY);
      window.history.replaceState(null, null);
    }
  }

  componentWillUnmount() {
    this.app.off('didChange', this.handleAppDidChange);
    window.removeEventListener('unload', this.handleBeforeUnload);
  }

  loadMore() {
    this.app.loadPackages(true);
  }

  render() {
    const packages = this.app.packages || [];
    const currentDate = this.app.currentDate;

    const lists = [];
    let list;
    for (const pkg of packages) {
      let date = moment(pkg.revealedOn);
      if (currentDate) date = date.utc();
      const listId = date.format('YYYYMMDD');
      if (!list || list.id !== listId) {
        list = {
          id: listId,
          date: pkg.revealedOn,
          packages: []
        };
        lists.push(list);
      }
      list.packages.push(pkg);
    }

    return (
      <div style={this.props.style}>
        <h4 style={{ marginBottom: '.7rem' }}>New packages</h4>
        <p style={[this.styles.hideIfSmall]}>With at least {this.app.minimumGitHubStars} GitHub stars or the <code>reveal</code> property set to <code>true</code> in <code>package.json</code></p>
        <hr />
        {
          lists.map(list => <PackageList key={list.id} date={list.date} items={list.packages} />)
        }
        {
          !this.app.noMorePackageToLoad ?
          <div>
            <Button onClick={::this.loadMore} disabled={this.app.loadingPackages}>
              {!this.app.loadingPackages ? 'More...' : 'Loading...'}
            </Button>
          </div> :
          false
        }
      </div>
    );
  }
}

export default Packages;
