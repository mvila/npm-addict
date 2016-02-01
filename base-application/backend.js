'use strict';

let argv = require('minimist')(process.argv.slice(2));
import sleep from 'sleep-promise';
import { CloudWatchLogs } from 'easy-aws';
import { AWSCloudWatchLogsOutput } from 'universal-log';
import BaseApplication from './';

export class BaseBackendApplication extends BaseApplication {
  constructor(options) {
    super(options);

    this.argv = argv;

    process.on('uncaughtException', err => {
      this.handleUncaughtException(err);
    });

    this.awsConfig = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION
    };

    if (this.environment !== 'development') {
      let cloudWatchLogs = new CloudWatchLogs(this.awsConfig);
      this.log.addOutput(new AWSCloudWatchLogsOutput(cloudWatchLogs));
    }
  }

  handleUncaughtException(err) {
    (async function() {
      this.log.emergency(err);
      await this.notifier.notify(`Process crashed (${err.message})`);
      await sleep(5000); // ensure the log is fully flushed
      process.exit(1); // eslint-disable-line no-process-exit
    }).call(this).catch(err => {
      console.error(err.stack || err);
    });
  }
}

export default BaseBackendApplication;
