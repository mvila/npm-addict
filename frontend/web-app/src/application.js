'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import { Style } from 'radium';
import fetch from 'isomorphic-fetch';
import idgen from 'idgen';
import querystring from 'querystring';
import BaseFrontendApplication from '../../../base-application/frontend';
import LocalData from './local-data';
import styles from './styles';
import Page from './components/page';

class Application extends BaseFrontendApplication {
  constructor(options) {
    super(options);

    this.url = this.frontendURL;

    this.localData = new LocalData();
  }

  async run() {
    await this.initialize();
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

  async initialize() {
    if (!this.localData.clientId) {
      this.localData.clientId = idgen(16);
    }
  }

  async loadPackages() {
    if (!this.packages) this.packages = [];

    this.loadingPackages = true;
    this.emit('didChange');

    let url = `${this.apiURL}new-packages`;

    let query = {};
    if (this.packages.length) {
      let lastPackage = this.packages[this.packages.length - 1];
      query.startAfter = lastPackage.date.toJSON();
    }
    let clientId = this.localData.clientId;
    if (clientId) query.clientId = clientId;
    query = querystring.stringify(query);
    if (query) url += '?' + query;

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
        npmURL: pkg.npmURL,
        gitHubURL: pkg.gitHubURL,
        date: new Date(pkg.date)
      });
    }

    this.loadingPackages = false;
    this.emit('didChange');
  }
}

let app = new Application({ name: 'npm-addict-frontend' });

app.run().catch(app.log.error);
