'use strict';

import Radium from 'radium';
import React from 'react';
let moment = require('moment');
import s from '../styles';
import PackageList from './package-list';

@Radium
export class NewPackages extends React.Component {
  static contextTypes = {
    app: React.PropTypes.object
  };

  componentWillMount() {
    this.handleAppDidChange = () => this.forceUpdate();
    this.context.app.on('didChange', this.handleAppDidChange);
  }

  componentWillUnmount() {
    this.context.app.off('didChange', this.handleAppDidChange);
  }

  loadMore() {
    this.context.app.loadPackages();
  }

  render() {
    let lists = [];
    let list;
    for (let pkg of this.context.app.packages) {
      let listId = moment(pkg.date).format('YYYYMMDD');
      if (!list || list.id !== listId) {
        list = {
          id: listId,
          date: pkg.date,
          packages: []
        };
        lists.push(list);
      }
      list.packages.push(pkg);
    }

    return (
      <div>
        <div style={[s.p2, s.bgWhite, s.border, s.rounded, this.props.style]}>
          <h2 style={[s.mt0, s.mb1, s.grayDarker, { lineHeight: 1 }]}>New Packages</h2>
          <p style={[s.mb0, s.grayDark]}>With at least 3 GitHub stars or the <code>promote</code> property set to <code>true</code> in <code>package.json</code></p>
          <hr style={[s.mt15, s.mb2]} />
          {
            lists.map(list => <PackageList key={list.id} date={list.date} items={list.packages} />)
          }
          <div>
            <button onClick={this.loadMore.bind(this)} style={[s.btn, s.btnOutline, { color: s.$grayDark, borderColor: s.$grayLight }]} disabled={this.context.app.loadingPackages}>
              {!this.context.app.loadingPackages ? 'More...' : 'Loading...'}
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default NewPackages;
