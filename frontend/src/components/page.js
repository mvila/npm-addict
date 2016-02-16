'use strict';

import React from 'react';
import Radium, { StyleRoot } from 'radium';
import { styles as s, variables as v } from '../styles';
import Header from './header';
import Footer from './footer';
import Packages from './packages';
import FAQ from './faq';
import Feeds from './feeds';

@Radium
export class Page extends React.Component {
  static propTypes = {
    app: React.PropTypes.object.isRequired
  };

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
        <div style={[{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }]}>
          <Header />
          <div style={[{ flexGrow: 1, display: 'flex', flexDirection: 'column', paddingBottom: '1rem', backgroundColor: v.lightestGray }]}>
            <div style={[{ flexGrow: 1, display: 'flex', justifyContent: 'center', padding: '1rem 1rem 0.75rem 1rem' }]}>
              {React.createElement(component, { style: [{ flexShrink: 1, minWidth: 0, width: 800, padding: '1rem', backgroundColor: v.bodyBackgroundColor }, s.bordered, s.rounded ] })}
            </div>
            <Footer />
          </div>
        </div>
      </StyleRoot>
    );
  }
}

export default Page;
