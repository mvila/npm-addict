'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import fetch from 'isomorphic-fetch';
import idgen from 'idgen';
import querystring from 'querystring';
import moment from 'moment';
import FrontendApplication from '../../frontend-application';
import LocalData from './local-data';
import Package from '../../models/package';
import Root from './components/root';

const PACKAGES_PER_PAGE = 100;

class Application extends FrontendApplication {
  constructor(options) {
    super(options);

    this.url = this.frontendURL;

    this.localData = new LocalData();
  }

  async run() {
    await this.initialize();

    await this.loadPackages();

    ReactDOM.render(
      <Root app={this} />,
      document.getElementById('root')
    );
  }

  async initialize() {
    if (!this.localData.clientId) {
      this.localData.clientId = idgen(16);
    }

    this.currentPage = this.getCurrentPageFromHash();
    this.currentDate = this.getCurrentDateFromHash();

    window.addEventListener('hashchange', ::this.handleHashChange, false);

    this.on('currentDate.didChange', () => {
      this.loadPackages();
    });
  }

  handleHashChange() {
    const page = this.getCurrentPageFromHash();
    if (page !== this.currentPage) {
      this.currentPage = page;
      this.emit('currentPage.didChange');
    }
    if (page === 'packages') {
      const date = this.getCurrentDateFromHash();
      if (date !== this.currentDate) {
        this.currentDate = date;
        this.emit('currentDate.didChange');
      }
    }
  }

  getCurrentPageFromHash() {
    switch (window.location.hash) {
      case '#/faq':
        return 'faq';
      case '#/feeds':
        return 'feeds';
      default:
        return 'packages';
    }
  }

  getCurrentDateFromHash() {
    if (!window.location.hash.startsWith('#/days/')) return undefined;
    let date = window.location.hash.substr(7);
    date = moment.utc(date).toDate();
    return date;
  }

  async loadPackages(more) {
    if (!more) this.packages = [];

    this.loadingPackages = true;
    this.emit('didChange');

    let url = `${this.apiURL}packages`;

    let query = { limit: PACKAGES_PER_PAGE + 1 };
    if (this.packages.length) {
      const lastPackage = this.packages[this.packages.length - 1];
      query.startAfter = lastPackage.revealedOn.toJSON();
    } else if (this.currentDate) {
      query.start = this.currentDate.toJSON();
    }
    if (this.currentDate) {
      query.endBefore = moment(this.currentDate).add(1, 'days').toDate().toJSON();
    }
    query.reverse = this.currentDate ? '0' : '1';
    const clientId = this.localData.clientId;
    if (clientId) query.clientId = clientId;
    query = querystring.stringify(query);
    if (query) url += '?' + query;

    const response = await fetch(url);
    if (response.status !== 200) {
      throw new Error(`Bad response from the API while fetching new packages (HTTP status: ${response.status})`);
    }

    const fetchedPackages = await response.json();
    if (fetchedPackages.length > PACKAGES_PER_PAGE) {
      fetchedPackages.pop();
      this.noMorePackageToLoad = false;
    } else {
      this.noMorePackageToLoad = true;
    }

    for (const pkg of fetchedPackages) {
      this.packages.push(new Package(pkg));
    }

    this.loadingPackages = false;
    this.emit('didChange');
    this.emit('packages.didLoad');
  }
}

const app = new Application({ name: 'npm-addict-frontend' });

app.run().catch(app.log.error);
