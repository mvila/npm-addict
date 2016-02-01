'use strict';

let argv = require('minimist')(process.argv.slice(2));
import sleep from 'sleep-promise';
import { CloudWatchLogs } from 'easy-aws';
import { AWSCloudWatchLogsOutput } from 'universal-log';
import { SlackIncomingWebhookTarget } from 'easy-notifier';
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
      if (!(this.awsConfig.accessKeyId && this.awsConfig.secretAccessKey && this.awsConfig.region)) {
        throw new Error('AWS configuration is incomplete');
      }
      let cloudWatchLogs = new CloudWatchLogs(this.awsConfig);
      this.log.addOutput(new AWSCloudWatchLogsOutput(cloudWatchLogs));
    }

    if (this.environment !== 'development') {
      let url = process.env.SLACK_INCOMING_WEBHOOK_URL;
      let channel = process.env.SLACK_INCOMING_WEBHOOK_CHANNEL;
      if (!(url && channel)) {
        throw new Error('Slack incoming webhook configuration is incomplete');
      }
      let target = new SlackIncomingWebhookTarget(url, { channel });
      this.notifier.addTarget(target);
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
