'use strict';

let fs = require('fs');
let pathModule = require('path');
let mkdirp = require('mkdirp');
let rimraf = require('rimraf');
let watch = require('node-watch');
let denodeify = require('denodeify');
let ncp = denodeify(require('ncp').ncp);
let UglifyJS = require('uglify-js');
let browserify = require('browserify');
let watchify = require('watchify');
let babelify = require('babelify');

// options:
//   watchMode
async function build(app, options = {}) {
  let buildNumber;
  let temporaryDir;

  let sourceDir = options.sourceDir;
  let targetDir = options.targetDir;
  let vendorDirname = options.vendorDirname;
  let inputStylesDirname = options.inputStylesDirname;
  let outputStylesDirname = options.outputStylesDirname;
  let sassFilename = options.sassFilename;
  let sassDependencyFilenames = options.sassDependencyFilenames;
  let vendorCSSPaths = options.vendorCSSPaths;
  let cssFilename = options.cssFilename;
  let htmlIndexFilenames = options.htmlIndexFilenames;
  let staticFilePaths = options.staticFilePaths;
  let scriptsDirname = options.scriptsDirname;
  let vendorScriptPaths = options.vendorScriptPaths;
  let vendorScriptFilename = options.vendorScriptFilename;
  let appScriptFilename = options.appScriptFilename;
  let browserifiedAppScriptFilename = options.browserifiedAppScriptFilename;
  let appCacheManifestFilename = options.appCacheManifestFilename;
  let appCachePaths = options.appCachePaths;
  let appCacheNetworkPaths = options.appCacheNetworkPaths;

  let watchMode = options.watchMode;

  async function initialize() {
    temporaryDir = pathModule.join('/tmp', app.name);
    mkdirp.sync(temporaryDir);
  }

  function resolveVariables(str) {
    str = str.replace(/\{environment\}/g, app.environment);
    str = str.replace(/\{displayName\}/g, app.displayName);
    str = str.replace(/\{version\}/g, app.version);
    str = str.replace(/\{buildNumber\}/g, buildNumber);
    return str;
  }

  function addAppCachePath(path) {
    if (appCachePaths.indexOf(path) === -1) {
      appCachePaths.push(path);
    }
  }

  async function checkEnvironment() {
    app.log.info('checkEnvironment: ' + app.environment);
  }

  async function getBuildNumber() {
    buildNumber = Date.now();
    app.log.info('getBuildNumber: ' + buildNumber);
  }

  async function buildCSS() {
    let output = '';

    let cssPaths = vendorCSSPaths.map(path => {
      return pathModule.join(sourceDir, vendorDirname, path);
    });
    cssPaths.forEach(function(path) {
      output += fs.readFileSync(path, 'utf8');
    });

    if (sassFilename) {
      let sass = require('node-sass');
      let inputDir = pathModule.join(sourceDir, inputStylesDirname || '');
      let inputPath = pathModule.join(inputDir, sassFilename);
      output += sass.renderSync({
        file: inputPath,
        includePaths: [inputDir]
      }).css;
    }

    if (output) {
      let outputDir = pathModule.join(targetDir, outputStylesDirname || '');
      mkdirp.sync(outputDir);
      let outputPath = pathModule.join(outputDir, cssFilename);
      fs.writeFileSync(outputPath, output);
      addAppCachePath(pathModule.join(outputStylesDirname || '', cssFilename));
    }

    app.log.info('buildCSS: done');
  }

  async function watchCSS() {
    let cssDir = pathModule.join(sourceDir, inputStylesDirname || '');
    let filenames = [];
    if (sassFilename) filenames.push(sassFilename);
    filenames = filenames.concat(sassDependencyFilenames);
    if (!filenames.length) return;
    let paths = filenames.map(filename => {
      return pathModule.join(cssDir, filename);
    });
    watch(paths, async function() {
      try {
        await getBuildNumber();
        await buildCSS();
        await copyHTMLIndexFiles();
        await buildAppCacheManifestFile();
      } catch (err) {
        app.log.error(err);
      }
    });
  }

  async function copyStaticFiles() {
    let outputDir = targetDir;
    for (let i = 0; i < staticFilePaths.length; i++) {
      let path = staticFilePaths[i];
      let srcPth, dstPth;
      if (typeof path === 'object') {
        srcPth = path.src;
        dstPth = path.dst;
      } else {
        srcPth = dstPth = path;
      }
      let inputPath = pathModule.join(sourceDir, srcPth);
      let outputPath = pathModule.join(outputDir, dstPth);
      await ncp(inputPath, outputPath, {
        stopOnErr: true,
        filter(pth) {
          return !/\.DS_Store$/.test(pth);
        },
        transform(read, write) {
          read.pipe(write);
          addAppCachePath(pathModule.relative(outputDir, write.path));
        }
      });
    }
    app.log.info('copyStaticFiles: done');
  }

  async function watchStaticFiles() {
    let filePaths = staticFilePaths.map(path => {
      if (typeof path === 'object') path = path.src;
      return pathModule.join(sourceDir, path);
    });
    watch(filePaths, async function() {
      try {
        await copyStaticFiles();
      } catch (err) {
        app.log.error(err);
      }
    });
  }

  async function concatVendorScript() {
    let scriptPaths = vendorScriptPaths.map(path => {
      return pathModule.join(sourceDir, vendorDirname, path);
    });
    let output = '';
    if (scriptPaths.length) {
      if (app.environment === 'development') {
        scriptPaths.forEach(path => {
          output += fs.readFileSync(path, 'utf8');
        });
      } else {
        let result = UglifyJS.minify(scriptPaths);
        output += result.code;
      }
    }
    if (output) {
      let outputDir = pathModule.join(targetDir, scriptsDirname || '');
      mkdirp.sync(outputDir);
      let outputPath = pathModule.join(outputDir, vendorScriptFilename);
      fs.writeFileSync(outputPath, output);
      addAppCachePath(pathModule.join(scriptsDirname || '', vendorScriptFilename));
    }
    app.log.info('concatVendorScript: done');
  }

  async function browserifyAppScript() {
    let inputDir = sourceDir;
    let inputPath = pathModule.join(inputDir, appScriptFilename);
    let opts = watchMode ? watchify.args : {};
    // if (app.environment === 'development') opts.debug = true;
    if (app.environment === 'development') opts.fullPaths = true;
    let bro = browserify(opts);
    bro.transform(babelify, {
      presets: ['es2015', 'react'],
      plugins: ['transform-decorators-legacy', 'transform-class-properties']
    });
    bro.require(inputPath, { entry: true });
    if (watchMode) bro = watchify(bro, { poll: 1000 });
    let originalBundle = bro.bundle;
    function _bundle() {
      return new Promise(function(resolve, reject) {
        originalBundle.call(bro, function(err, res) {
          if (err) reject(err); else resolve(res);
        });
      });
    }
    async function bundle() {
      let output = await _bundle();
      if (app.environment !== 'development') {
        output = (UglifyJS.minify(output.toString(), { fromString: true })).code;
      }
      let outputDir = pathModule.join(targetDir, scriptsDirname || '');
      let outputPath = pathModule.join(outputDir, browserifiedAppScriptFilename);
      fs.writeFileSync(outputPath, output);
      app.log.info('browserifyAppScript: done');
    }
    if (watchMode) {
      bro.on('update', async function() {
        try {
          await getBuildNumber();
          await bundle();
          await copyHTMLIndexFiles();
          await buildAppCacheManifestFile();
          await notifySuccess();
        } catch (err) {
          app.log.error(err);
        }
      });
    }
    await bundle();
    addAppCachePath(pathModule.join(scriptsDirname || '', browserifiedAppScriptFilename));
  }

  async function copyHTMLIndexFiles() {
    for (let filename of htmlIndexFilenames) {
      let inputDir = sourceDir;
      let inputPath = pathModule.join(inputDir, filename);
      let html = fs.readFileSync(inputPath, 'utf8');
      html = resolveVariables(html);
      let outputDir = targetDir;
      let outputPath = pathModule.join(outputDir, filename);
      outputDir = pathModule.dirname(outputPath);
      mkdirp.sync(outputDir);
      fs.writeFileSync(outputPath, html);
      addAppCachePath(filename);
    }
    app.log.info('copyHTMLIndexFiles: done');
  }

  async function buildAppCacheManifestFile() {
    if (!appCacheManifestFilename) return;
    let output = 'CACHE MANIFEST\n';
    output += '# Build: ' + buildNumber + '\n';
    output += '# Date: ' + (new Date()).toISOString() + '\n';
    output += '\n';
    output += 'CACHE:\n';
    output += appCachePaths.join('\n') + '\n';
    output += '\n';
    output += 'NETWORK:\n';
    output += appCacheNetworkPaths.join('\n') + '\n';
    let outputPath = pathModule.join(targetDir, appCacheManifestFilename);
    fs.writeFileSync(outputPath, output);
    app.log.info('buildAppCacheManifestFile: done');
  }

  async function cleanAll() {
    rimraf.sync(targetDir);
  }

  async function notifySuccess() {
    if (app.environment === 'development') {
      app.notifier.notify(
        'Build Succeeded',
        `${app.displayName} has been successfully built`
      );
    }
  }

  async function buildAll() {
    mkdirp.sync(targetDir);
    await checkEnvironment();
    await getBuildNumber();
    await buildCSS();
    await copyStaticFiles();
    await concatVendorScript();
    await browserifyAppScript();
    await copyHTMLIndexFiles();
    await buildAppCacheManifestFile();
    await notifySuccess();
  }

  async function watchAll() {
    await watchCSS();
    await watchStaticFiles();
  }

  await initialize();
  await cleanAll();
  await buildAll();
  if (watchMode) await watchAll();
}

export let builder = { build };

export default builder;
