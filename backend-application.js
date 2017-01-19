'use strict';

const argv = require('minimist')(process.argv.slice(2));
import sleep from 'sleep-promise';
import { CloudWatchLogs } from 'easy-aws';
import { AWSCloudWatchLogsOutput } from 'universal-log';
import { SlackIncomingWebhookTarget } from 'easy-notifier';
import BaseApplication from './base-application';

export class BackendApplication extends BaseApplication {
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
      if (this.argv['aws-cloud-watch-logs'] !== false) {
        if (this.awsConfig.accessKeyId && this.awsConfig.secretAccessKey && this.awsConfig.region) {
          const cloudWatchLogs = new CloudWatchLogs(this.awsConfig);
          this.log.addOutput(new AWSCloudWatchLogsOutput(cloudWatchLogs));
        }
      }
    }

    if (this.environment !== 'development') {
      if (this.argv['slack-notifications'] !== false) {
        const url = process.env.SLACK_INCOMING_WEBHOOK_URL;
        const channel = process.env.SLACK_INCOMING_WEBHOOK_CHANNEL;
        if (url && channel) {
          const target = new SlackIncomingWebhookTarget(url, { channel });
          this.notifier.addTarget(target);
        }
      }
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

export default BackendApplication;
