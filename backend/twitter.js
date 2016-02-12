'use strict';

import Twit from 'twit';
import truncate from 'lodash/truncate';

const MAX_LENGTH = 140;
const CONFIGURATION_TTL = 24 * 60 * 60 * 1000; // 24 hours

export class Twitter {
  constructor(app) {
    this.app = app;

    this.disabled = !(process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET && process.env.TWITTER_ACCESS_TOKEN && process.env.TWITTER_ACCESS_TOKEN_SECRET);

    if (!this.disabled) {
      /* eslint-disable camelcase */
      this.twit = new Twit({
        consumer_key: process.env.TWITTER_CONSUMER_KEY,
        consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
        access_token: process.env.TWITTER_ACCESS_TOKEN,
        access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
        timeout_ms: 60 * 1000
      });
      /* eslint-enable */
    }
  }

  async initialize() {
    if (this.disabled) return false;
    if (this.initialized) return true;
    await this.loadConfiguration();
    if (!this.configuration) return false;
    this.configurationLoadIntervalId = setInterval(
      () => this.loadConfiguration(),
      CONFIGURATION_TTL
    );
    this.initialized = true;
    return true;
  }

  async loadConfiguration() {
    if (this.disabled) return;
    try {
      let data = (await this.twit.get('help/configuration')).data;
      if (data.errors) throw new Error(data.errors[0].message);
      this.configuration = data;
      this.app.log.info('Twitter configuration loaded');
    } catch (err) {
      this.app.log.warning(`An error occured while getting configuration from Twitter API (${err.message})`);
    }
  }

  async post(text, url) {
    if (!(await this.initialize())) return;
    let status = this.format(text, url);
    try {
      let data = (await this.twit.post('statuses/update', { status })).data;
      if (data.errors) throw new Error(data.errors[0].message);
      this.app.log.info(`"${status}" status tweeted`);
    } catch (err) {
      this.app.log.warning(`An error occured while tweeting "${status}" (${err.message})`);
    }
  }

  format(text, url) {
    let maxLength = MAX_LENGTH;
    if (url) maxLength -= 1 + this.configuration.short_url_length_https;
    let status = truncate(text, { length: maxLength });
    if (url) status += ' ' + url;
    return status;
  }

  close() {
    if (!this.configurationLoadIntervalId) return;
    clearInterval(this.configurationLoadIntervalId);
  }
}

export default Twitter;
