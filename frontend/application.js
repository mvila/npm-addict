'use strict';

let pathModule = require('path');
import BackendApplication from '../backend-application';
import Builder from '../builder';
import server from '../server';

class Application extends BackendApplication {
  constructor(options) {
    super(options);

    this.url = this.frontendURL;

    switch (this.environment) {
      case 'development':
        this.port = 8812;
        break;
      case 'test':
        this.port = 8822;
        break;
      case 'production':
        this.port = 8832;
        break;
      default:
        throw new Error(`Unknown environment ('${this.environment}')`);
    }
  }

  async run() {
    let command = this.argv._[0];
    if (!command) throw new Error('Command is missing');
    switch (command) {
      case 'build':
        let watch = this.argv.watch === true;
        await this.build({ watch });
        break;
      case 'start':
        await this.start();
        break;
      default:
        throw new Error(`Unknown command '${command}'`);
    }
  }

  async build(options = {}) {
    let builder = new Builder(this, {
      sourceDir: pathModule.join(__dirname, 'src'),
      targetDir: pathModule.join(__dirname, 'dist'),

      vendorDirname: 'vendor',

      stylesDirname: undefined, // 'styles'
      sassFilename: undefined,
      sassDependencyFilenames: [],
      vendorCSSPaths: [],
      cssFilename: 'index.css',

      htmlIndexFilenames: ['index.html'],

      staticFilePaths: [
        'favicon.png',
        'images'
      ],

      inputStylesDirname: undefined, // 'scripts'
      outputStylesDirname: undefined, // 'scripts'

      vendorScriptPaths: [],
      vendorScriptFilename: 'vendor.js',

      appScriptFilename: 'index.js',
      browserifiedAppScriptFilename: 'index.js',

      appCacheManifestFilename: undefined,
      appCachePaths: [],
      appCacheNetworkPaths: [],

      watchMode: options.watch
    });

    await builder.build();
  }

  async start() {
    server.start(this, {
      port: this.port,
      path: pathModule.join(__dirname, 'dist')
    });
  }
}

let runner = new Application({ name: 'npm-addict-frontend' });

runner.run().catch(function(err) {
  runner.handleUncaughtException(err);
});
