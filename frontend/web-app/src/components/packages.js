'use strict';

import Radium from 'radium';
import React from 'react';
import moment from 'moment';
import s from '../styles';
import PackageList from './package-list';

@Radium
export class Packages extends React.Component {
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
      <div style={[s.p2, s.bgWhite, s.border, s.rounded, this.props.style]}>
        <h2 style={[s.mt0, s.mb1, s.grayDarker, { lineHeight: 1 }]}>New Packages</h2>
        <p style={[s.mb0, s.grayDark, s.smShow]}>With at least 3 GitHub stars or the <code>reveal</code> property set to <code>true</code> in <code>package.json</code></p>
        <hr style={[s.mt15, s.mb2, s.smShow]} />
        {
          lists.map(list => <PackageList key={list.id} date={list.date} items={list.packages} />)
        }
        {
          !this.context.app.noMorePackageToLoad ?
          <div>
            <Button onClick={::this.loadMore} style={[s.btn, s.btnOutline, { color: s.$grayDark, borderColor: s.$grayLight }]} disabled={this.context.app.loadingPackages}>
              {!this.context.app.loadingPackages ? 'More...' : 'Loading...'}
            </Button>
          </div> :
          false
        }
      </div>
    );
  }
}

@Radium
class Button extends React.Component {
  render() {
    return <button {...this.props} />;
  }
}

export default Packages;
