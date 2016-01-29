'use strict';

import Radium from 'radium';
import React from 'react';
import s from '../styles';
import Header from './header';
import Footer from './Footer';
import NewPackages from './new-packages';
import FAQ from './faq';

@Radium
export class Page extends React.Component {
  static childContextTypes = {
    app: React.PropTypes.object
  };

  getChildContext() {
    return { app: this.props.app };
  }

  componentDidMount() {
    this.handleHashChange = () => this.forceUpdate();
    window.addEventListener('hashchange', this.handleHashChange, false);
  }

  componentWillUnmount() {
    window.removeEventListener('hashchange', this.handleHashChange);
  }

  render() {
    let component;
    switch (window.location.hash) {
      case '#/faq':
        component = FAQ;
        break;
      default:
        component = NewPackages;
    }

    return (
      <div style={[s.flex, s.flexColumn, { minHeight: '100vh' }]}>
        <Header />
        <div style={[s.flexAuto, s.flex, s.flexColumn, s.bgGrayLightest]}>
          <div style={[s.flexAuto, s.flex, s.px2, s.pt2, s.pb15, { justifyContent: 'center' }]}>
            {React.createElement(component, { style: { maxWidth: 800 } })}
          </div>
          <Footer />
        </div>
      </div>
    );
  }
}

export default Page;
