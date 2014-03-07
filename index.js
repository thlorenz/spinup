'use strict';

// github redirects for tarball downloads, so we need request here
var path         = require('path')
  , dockerify    = require('dockerify')
  , runnel       = require('runnel')
  , xtend        = require('xtend')
  , util         = require('util')
  , tarStream    = require('./lib/tar-stream')
  , stringifyMsg = require('./lib/stringify-msg')
  , Images       = require('./lib/images')
  , Containers   = require('./lib/containers')

var log = require('npmlog');

var docker = require('./lib/docker');
var dir = console.dir.bind(console);

var defaultDockerfile = path.join(__dirname, 'lib', 'Dockerfile');

function inspect(obj, depth) {
  return util.inspect(obj, false, depth || 5, true);
}

function logMsg (chunk) {
  log.info('spinup', stringifyMsg(chunk));
}

function localTarStream() {
  var fs = require('fs');
  return fs.createReadStream(__dirname + '/tmp/in.tar.gz', 'utf8').pipe(require('zlib').createGunzip());
}

function buildImage(images, opts, cb) {
  opts = xtend({ hub: 'github', dockerfile: defaultDockerfile }, opts);
  
  if (!opts.repo) return cb(new Error('Need to provide repo to pull image from'));
  if (!opts.tag)  return cb(new Error('Need to provide tag to pull image from'));

  images.build(opts, cb);
}

function buildImages (images, opts, tags, cb) {
  var tasks = tags
    .map(function (x) {
      return function (cb_) {
        buildImage(images, xtend(opts, { tag: x }), cb_)
      }
    });

  runnel(tasks.concat(cb));
}

var go = module.exports = 

function (opts, cb) {

  var port = 42222;
  var images = new Images();

  images
    .on('processing', function (info) {
      log.silly('images', 'processing\n', inspect(info));
    }) 
    .on('building', function (info) {
      log.verbose('images', 'building\n', inspect(info));
    }) 
    .on('built', function (info) {
      log.silly('images', 'built\n', inspect(info));
    }) 
    .on('msg', function (info) {
      log.info('images', 'msg', inspect(info));
    })
    .on('error', function (err) {
      log.error('images', 'error', err);
    })

  buildImages(images, opts, refs.tags, function (err, res) {
     if (err) return cb(err);
     cb(null, res);
  });
};


var refs = { 
  heads: [ 'gh-pages', 'master' ],
  tags:
   [ '000-nstarted',
     '001-start',
     '002-main',
     '003-static-server',
     '004-rendering-markdown-on-server',
     '005-styled',
     '006-dynamic-bundle',
     '007-rendering-md-client-side',
     '008-updating-on-edit-in-realtime',
     '009-improved-styling',
     '010-finished-dev-version',
     '011-finished-product' ],
  pulls: [ '1/head' ] 
}

// Test
if (!module.parent && typeof window === 'undefined') {
  var opts = {
      repo : 'thlorenz/browserify-markdown-editor'
    , port: 3000
  }

  log.level = 'verbose';
  go(opts, function (err) {
    if (err) return console.error(err);
    console.log('done');  
  });
}
