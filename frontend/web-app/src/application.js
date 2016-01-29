'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import { Style } from 'radium';
import fetch from 'isomorphic-fetch';
import sleep from 'sleep-promise';
import FrontendApplication from '../../../abstract-application/frontend';
import styles from './styles';
import Page from './components/page';

class App extends FrontendApplication {
  constructor(options) {
    super(options);
    this.url = this.frontendURL;
  }

  async run() {
    await this.loadPackages();

    ReactDOM.render(
      <Style rules={styles} />,
      document.getElementById('styles')
    );

    ReactDOM.render(
      <Page app={this} />,
      document.getElementById('root')
    );
  }

  async loadPackages() {
    if (!this.packages) this.packages = [];

    this.loadingPackages = true;
    this.emit('didChange');

    let url = `${this.apiURL}new-packages`;
    if (this.packages.length) {
      let lastPackage = this.packages[this.packages.length - 1];
      url += '?startAfter=' + lastPackage.date.toJSON();
    }
    let response = await fetch(url);
    if (response.status !== 200) {
      throw new Error(`Bad response from the API while fetching new packages (HTTP status: ${response.status})`);
    }
    let fetchedPackages = await response.json();
    for (let pkg of fetchedPackages) {
      this.packages.push({
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        url: pkg.url,
        date: new Date(pkg.date)
      });
    }

    this.loadingPackages = false;
    this.emit('didChange');
  }
}

let app = new App({ name: 'npm-addict-frontend' });

app.run().catch(app.log.error);
