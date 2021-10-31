'use strict';

import fs from 'fs';
import pathModule from 'path';
import pick from 'lodash/pick';
import mkdirp from 'mkdirp';
import rimraf from 'rimraf';
import denodeify from 'denodeify';
import ncpModule from 'ncp';
const ncp = denodeify(ncpModule.ncp);
import UglifyJS from 'uglify-js';
import { minify } from 'terser';
import browserify from 'browserify';
import babelify from 'babelify';

export class Builder {
  constructor(app, options = {}) {
    this.app = app;

    Object.assign(this, pick(options, [
      'sourceDir',
      'targetDir',
      'vendorDirname',
      'inputStylesDirname',
      'outputStylesDirname',
      'sassFilename',
      'sassDependencyFilenames',
      'vendorCSSPaths',
      'cssFilename',
      'htmlIndexFilenames',
      'staticFilePaths',
      'scriptsDirname',
      'vendorScriptPaths',
      'vendorScriptFilename',
      'appScriptFilename',
      'browserifiedAppScriptFilename',
      'appCacheManifestFilename',
      'appCachePaths',
      'appCacheNetworkPaths',
      'watchMode'
    ]));
  }

  async build() {
    await this.initialize();
    await this.cleanAll();
    await this.buildAll();
    if (this.watchMode) await this.watchAll();
  }

  async initialize() {
    this.temporaryDir = pathModule.join('/tmp', this.app.name);
    mkdirp.sync(this.temporaryDir);
  }

  resolveVariables(str) {
    str = str.replace(/\{environment\}/g, this.app.environment);
    str = str.replace(/\{displayName\}/g, this.app.displayName);
    str = str.replace(/\{description\}/g, this.app.description);
    str = str.replace(/\{version\}/g, this.app.version);
    str = str.replace(/\{buildNumber\}/g, this.buildNumber);
    str = str.replace(/\{url\}/g, this.app.url);
    str = str.replace(/\{frontendURL\}/g, this.app.frontendURL);
    str = str.replace(/\{apiURL\}/g, this.app.apiURL);
    str = str.replace(/\{googleAnalyticsTrackingId\}/g, this.app.googleAnalyticsTrackingId);
    return str;
  }

  addAppCachePath(path) {
    if (this.appCachePaths.indexOf(path) === -1) {
      this.appCachePaths.push(path);
    }
  }

  async checkEnvironment() {
    this.app.log.info('checkEnvironment: ' + this.app.environment);
  }

  async generateBuildNumber() {
    this.buildNumber = Date.now();
    this.app.log.info('generateBuildNumber: ' + this.buildNumber);
  }

  async buildCSS() {
    let output = '';

    const cssPaths = this.vendorCSSPaths.map(path => {
      return pathModule.join(this.sourceDir, this.vendorDirname, path);
    });
    cssPaths.forEach(function(path) {
      output += fs.readFileSync(path, 'utf8');
    });

    if (this.sassFilename) {
      const sass = require('node-sass');
      const inputDir = pathModule.join(this.sourceDir, this.inputStylesDirname || '');
      const inputPath = pathModule.join(inputDir, this.sassFilename);
      output += sass.renderSync({
        file: inputPath,
        includePaths: [inputDir]
      }).css;
    }

    if (output) {
      const outputDir = pathModule.join(this.targetDir, this.outputStylesDirname || '');
      mkdirp.sync(outputDir);
      const outputPath = pathModule.join(outputDir, this.cssFilename);
      fs.writeFileSync(outputPath, output);
      this.addAppCachePath(pathModule.join(this.outputStylesDirname || '', this.cssFilename));
    }

    this.app.log.info('buildCSS: done');
  }

  async watchCSS() {
    const watch = require('node-watch');
    const cssDir = pathModule.join(this.sourceDir, this.inputStylesDirname || '');
    let filenames = [];
    if (this.sassFilename) filenames.push(this.sassFilename);
    filenames = filenames.concat(this.sassDependencyFilenames);
    if (!filenames.length) return;
    const paths = filenames.map(filename => {
      return pathModule.join(cssDir, filename);
    });
    watch(paths, async function() {
      try {
        await this.generateBuildNumber();
        await this.buildCSS();
        await this.copyHTMLIndexFiles();
        await this.buildAppCacheManifestFile();
      } catch (err) {
        this.app.log.error(err);
      }
    }.bind(this));
  }

  async copyStaticFiles() {
    const outputDir = this.targetDir;
    for (let i = 0; i < this.staticFilePaths.length; i++) {
      const path = this.staticFilePaths[i];
      let srcPth, dstPth;
      if (typeof path === 'object') {
        srcPth = path.src;
        dstPth = path.dst;
      } else {
        srcPth = dstPth = path;
      }
      const inputPath = pathModule.join(this.sourceDir, srcPth);
      const outputPath = pathModule.join(outputDir, dstPth);
      await ncp(inputPath, outputPath, {
        stopOnErr: true,
        filter(pth) {
          return !/\.DS_Store$/.test(pth);
        },
        transform: (read, write) => {
          read.pipe(write);
          this.addAppCachePath(pathModule.relative(outputDir, write.path));
        }
      });
    }
    this.app.log.info('copyStaticFiles: done');
  }

  async watchStaticFiles() {
    const watch = require('node-watch');
    const filePaths = this.staticFilePaths.map(path => {
      if (typeof path === 'object') path = path.src;
      return pathModule.join(this.sourceDir, path);
    });
    watch(filePaths, async function() {
      try {
        await this.copyStaticFiles();
      } catch (err) {
        this.app.log.error(err);
      }
    }.bind(this));
  }

  async concatVendorScript() {
    const scriptPaths = this.vendorScriptPaths.map(path => {
      return pathModule.join(this.sourceDir, this.vendorDirname, path);
    });
    let output = '';
    if (scriptPaths.length) {
      if (this.app.environment === 'development') {
        scriptPaths.forEach(path => {
          output += fs.readFileSync(path, 'utf8');
        });
      } else {
        const result = UglifyJS.minify(scriptPaths);
        output += result.code;
      }
    }
    if (output) {
      const outputDir = pathModule.join(this.targetDir, this.scriptsDirname || '');
      mkdirp.sync(outputDir);
      const outputPath = pathModule.join(outputDir, this.vendorScriptFilename);
      fs.writeFileSync(outputPath, output);
      this.addAppCachePath(pathModule.join(this.scriptsDirname || '', this.vendorScriptFilename));
    }
    this.app.log.info('concatVendorScript: done');
  }

  async browserifyAppScript() {
    let watchify;
    if (this.watchMode) {
      watchify = require('watchify');
    }
    const inputDir = this.sourceDir;
    const inputPath = pathModule.join(inputDir, this.appScriptFilename);
    const opts = this.watchMode ? watchify.args : {};
    // if (this.app.environment === 'development') opts.debug = true;
    if (this.app.environment === 'development') opts.fullPaths = true;
    let bro = browserify(opts);
    bro.transform(babelify, {
      presets: ['es2015', 'react'],
      plugins: ['transform-decorators-legacy', 'transform-class-properties']
    });
    bro.require(inputPath, { entry: true });
    if (this.watchMode) bro = watchify(bro);
    const originalBundle = bro.bundle;
    function _bundle() {
      return new Promise(function(resolve, reject) {
        originalBundle.call(bro, function(err, res) {
          if (err) reject(err); else resolve(res);
        });
      });
    }
    const bundle = async function() {
      let output = await _bundle();
      if (this.app.environment !== 'development') {
        output = (await minify(output.toString(), {'keep_classnames': true})).code;
      }
      const outputDir = pathModule.join(this.targetDir, this.scriptsDirname || '');
      const outputPath = pathModule.join(outputDir, this.browserifiedAppScriptFilename);
      fs.writeFileSync(outputPath, output);
      this.app.log.info('browserifyAppScript: done');
    }.bind(this);
    if (this.watchMode) {
      bro.on('update', async function() {
        try {
          await this.generateBuildNumber();
          await bundle();
          await this.copyHTMLIndexFiles();
          await this.buildAppCacheManifestFile();
          await this.notifySuccess();
        } catch (err) {
          this.app.log.error(err);
        }
      }.bind(this));
    }
    await bundle();
    this.addAppCachePath(pathModule.join(this.scriptsDirname || '', this.browserifiedAppScriptFilename));
  }

  async copyHTMLIndexFiles() {
    for (const filename of this.htmlIndexFilenames) {
      const inputDir = this.sourceDir;
      const inputPath = pathModule.join(inputDir, filename);
      let html = fs.readFileSync(inputPath, 'utf8');
      html = this.resolveVariables(html);
      let outputDir = this.targetDir;
      const outputPath = pathModule.join(outputDir, filename);
      outputDir = pathModule.dirname(outputPath);
      mkdirp.sync(outputDir);
      fs.writeFileSync(outputPath, html);
      this.addAppCachePath(filename);
    }
    this.app.log.info('copyHTMLIndexFiles: done');
  }

  async buildAppCacheManifestFile() {
    if (!this.appCacheManifestFilename) return;
    let output = 'CACHE MANIFEST\n';
    output += '# Build: ' + this.buildNumber + '\n';
    output += '# Date: ' + (new Date()).toISOString() + '\n';
    output += '\n';
    output += 'CACHE:\n';
    output += this.appCachePaths.join('\n') + '\n';
    output += '\n';
    output += 'NETWORK:\n';
    output += this.appCacheNetworkPaths.join('\n') + '\n';
    const outputPath = pathModule.join(this.targetDir, this.appCacheManifestFilename);
    fs.writeFileSync(outputPath, output);
    this.app.log.info('buildAppCacheManifestFile: done');
  }

  async cleanAll() {
    rimraf.sync(this.targetDir);
  }

  async notifySuccess() {
    if (this.app.environment === 'development') {
      this.app.notifier.notify(
        'Build Succeeded',
        `${this.app.displayName} has been successfully built`
      );
    }
  }

  async buildAll() {
    mkdirp.sync(this.targetDir);
    await this.checkEnvironment();
    await this.generateBuildNumber();
    await this.buildCSS();
    await this.copyStaticFiles();
    await this.concatVendorScript();
    await this.browserifyAppScript();
    await this.copyHTMLIndexFiles();
    await this.buildAppCacheManifestFile();
    await this.notifySuccess();
  }

  async watchAll() {
    await this.watchCSS();
    await this.watchStaticFiles();
  }
}

export default Builder;
