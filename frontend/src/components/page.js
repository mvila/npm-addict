'use strict';

import React from 'react';
import Common from './common';
import Header from './header';
import Footer from './footer';
import Packages from './packages';
import FAQ from './faq';
import Feeds from './feeds';
import Banner from './banner';
import Sunset from './sunset';

@Common
export class Page extends React.Component {
  componentDidMount() {
    this.handleCurrentPageDidChange = () => {
      this.forceUpdate();
      setTimeout(() => window.scroll(0, 0), 100);
    };
    this.app.on('currentPage.didChange', this.handleCurrentPageDidChange);
  }

  componentWillUnmount() {
    this.app.off('currentPage.didChange', this.handleCurrentPageDidChange);
  }

  render() {
    const s = this.styles;

    let component;
    switch (this.app.currentPage) {
      case 'faq':
        component = FAQ;
        break;
      case 'feeds':
        component = Feeds;
        break;
      case 'sunset':
        component = Sunset;
        break;
      default:
        component = Packages;
    }

    return (
      <div style={[{ display: 'flex', flexDirection: 'column', height: '100vh' }]}>
        <Banner />
        <Header />
        <div style={[{ flexGrow: 1, flexShrink: 0, display: 'flex', flexDirection: 'column', paddingBottom: '1rem' }, s.backgroundAltBodyColor]}>
          <div style={[{ flexGrow: 1, display: 'flex', justifyContent: 'center', padding: '1rem 1rem 0.75rem 1rem' }]}>
            {React.createElement(component, { style: [{ flexShrink: 1, minWidth: 0, width: 800, padding: '1rem' }, s.backgroundBodyColor, s.border, s.rounded ] })}
          </div>
          <Footer />
        </div>
      </div>
    );
  }
}

export default Page;
