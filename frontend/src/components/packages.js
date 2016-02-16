'use strict';

import Radium from 'radium';
import React from 'react';
import moment from 'moment';
import { styles as s } from '../styles';
import PackageList from './package-list';
import Button from './button';

@Radium
export class Packages extends React.Component {
  static propTypes = {
    style: React.PropTypes.oneOfType([
      React.PropTypes.object,
      React.PropTypes.array
    ])
  };

  static contextTypes = {
    app: React.PropTypes.object
  };

  componentWillMount() {
    this.handleAppDidChange = () => this.forceUpdate();
    this.context.app.on('didChange', this.handleAppDidChange);

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
    this.context.app.off('didChange', this.handleAppDidChange);
    window.removeEventListener('unload', this.handleBeforeUnload);
  }

  loadMore() {
    this.context.app.loadPackages(true);
  }

  render() {
    let packages = this.context.app.packages || [];
    let currentDate = this.context.app.currentDate;

    let lists = [];
    let list;
    for (let pkg of packages) {
      let date = moment(pkg.itemCreatedOn);
      if (currentDate) date = date.utc();
      let listId = date.format('YYYYMMDD');
      if (!list || list.id !== listId) {
        list = {
          id: listId,
          date: pkg.itemCreatedOn,
          packages: []
        };
        lists.push(list);
      }
      list.packages.push(pkg);
    }

    return (
      <div style={this.props.style}>
        <h4>New Packages</h4>
        <p style={[s.hiddenIfSmall]}>With at least 3 GitHub stars or the <code>reveal</code> property set to <code>true</code> in <code>package.json</code></p>
        <hr />
        {
          lists.map(list => <PackageList key={list.id} date={list.date} items={list.packages} />)
        }
        {
          !this.context.app.noMorePackageToLoad ?
          <div>
            <Button onClick={::this.loadMore} disabled={this.context.app.loadingPackages}>
              {!this.context.app.loadingPackages ? 'More...' : 'Loading...'}
            </Button>
          </div> :
          false
        }
      </div>
    );
  }
}

export default Packages;
