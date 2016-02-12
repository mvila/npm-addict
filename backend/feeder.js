'use strict';

import moment from 'moment';
import escape from 'lodash/escape';
import sleep from 'sleep-promise';

const SLEEP_TIME = 1 * 60 * 1000; // 1 minute

export class Feeder {
  constructor(app) {
    this.app = app;
  }

  async run() {
    while (true) {
      await sleep(SLEEP_TIME);
      if (!this.app.state.lastFetchDate) continue;
      let todayDate = moment.utc().startOf('day').toDate();
      if (this.app.state.lastFetchDate < todayDate) continue;
      let yesterdayDate = moment(todayDate).subtract(1, 'days').toDate();
      let lastDate = this.app.state.lastDailyFeedPostDate;
      if (!lastDate) lastDate = moment(yesterdayDate).subtract(3, 'days').toDate();
      let days = moment(yesterdayDate).diff(moment(lastDate), 'days');
      for (let day = 0; day < days; day++) {
        let date = moment(lastDate).add(1, 'days').toDate();
        await this.post(date);
        lastDate = date;
        this.app.state.lastDailyFeedPostDate = lastDate;
        await this.app.state.save();
      }
    }
  }

  async post(date) {
    let start = date;
    let endBefore = moment(date).add(1, 'days').toDate();
    let packages = await this.app.store.Package.find({
      query: { visible: true },
      order: 'itemCreatedOn',
      start: start.toJSON(),
      endBefore: endBefore.toJSON()
    });

    if (!packages.length) {
      this.app.log.warning(`No packages found on ${moment.utc(start).format('LL')}`);
      return;
    }

    let title = `New npm Packages on ${moment.utc(start).format('LL')}`;

    let content = '';
    for (let pkg of packages) {
      content += `<p>\n`;
      content += `<a href="${pkg.bestURL}">`;
      content += `${escape(pkg.name)}`;
      content += '</a>';
      content += `<br>\n`;
      content += `${escape(pkg.formattedDescription)}\n`;
      content += `</p>\n`;
    }

    let url = this.app.frontendURL + '#/days/' + moment.utc(start).format('YYYY-MM-DD');

    await this.app.store.Post.put({ title, content, url });

    this.app.log.notice(`New post created for ${moment.utc(start).format('LL')}`);
  }
}

export default Feeder;
