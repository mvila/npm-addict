'use strict';

import React from 'react';
import Radium, { StyleRoot } from 'radium';
import s from '../styles';
import Header from './header';
import Footer from './footer';
import Packages from './packages';
import FAQ from './faq';
import Feeds from './feeds';

@Radium
export class Page extends React.Component {
  static childContextTypes = {
    app: React.PropTypes.object
  };

  getChildContext() {
    return { app: this.props.app };
  }

  componentDidMount() {
    this.handleCurrentPageDidChange = () => {
      this.forceUpdate();
      setTimeout(() => window.scroll(0, 0), 100);
    };
    this.props.app.on('currentPage.didChange', this.handleCurrentPageDidChange);
  }

  componentWillUnmount() {
    this.props.app.off('currentPage.didChange', this.handleCurrentPageDidChange);
  }

  render() {
    let component;
    switch (this.props.app.currentPage) {
      case 'faq':
        component = FAQ;
        break;
      case 'feeds':
        component = Feeds;
        break;
      default:
        component = Packages;
    }

    return (
      <StyleRoot>
        <div style={[s.flex, s.flexColumn, { minHeight: '100vh' }]}>
          <Header />
          <div style={[s.flexAuto, s.flex, s.flexColumn, s.bgGrayLightest]}>
            <div style={[s.flexAuto, s.flex, s.px2, s.pt2, s.pb15, { justifyContent: 'center' }]}>
              {React.createElement(component, { style: [{ flex: '0 1 auto', minWidth: 0, width: 800 }] })}
            </div>
            <Footer />
          </div>
        </div>
      </StyleRoot>
    );
  }
}

export default Page;
