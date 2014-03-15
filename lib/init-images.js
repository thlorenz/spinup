'use strict';

var path         = require('path')
  , log          = require('npmlog')
  , runnel       = require('runnel')
  , xtend        = require('xtend')
  , util         = require('util')
  , tarStream    = require('./tar-stream')
  , docker       = require('./docker')
  , Images       = require('../adw/images')

var wifiSucks = false;

var defaultDockerfile = path.join(__dirname, 'Dockerfile');

function inspect(obj, depth) {
  return util.inspect(obj, false, depth || 5, true);
}

function localTarStream() {
  var fs = require('fs');
  return fs.createReadStream(__dirname + '/../tmp/in.tar.gz', 'utf8')
    .pipe(require('zlib')
    .createGunzip());
}

function buildImage(images, opts, cb) {
  var hub = opts.hub || 'github';

  if (!opts.repo) return cb(new Error('Need to provide repo to pull image from'));
  if (!opts.tag)  return cb(new Error('Need to provide tag to pull image from'));

  opts = xtend({ 
      hub        : 'github'
    , strip      : 1
    , dockerfile : defaultDockerfile
    , tarStream  : wifiSucks 
        ? localTarStream() 
        : tarStream[hub](opts.repo, opts.tag)
  }, opts);
  

  images.build(opts, cb);
}

function buildImages (images, opts, tags, cb) {
  var tasks = tags
    .map(function (tag) {
      var image = docker.imageName(opts.repo, tag)
      return function (cb_) {
        buildImage(images, xtend(opts, { tag: tag, Image: image }), cb_)
      }
    });

  runnel(tasks.concat(cb));
}

module.exports = function initImages(tags, opts, cb) {
  var images = new Images(docker);

  images
    .on('processing' , function (info) { log.silly  ('images', 'processing\n', inspect(info)); })
    .on('building'   , function (info) { log.verbose('images', 'building\n', inspect  (info)); })
    .on('built'      , function (info) { log.info   ('images', 'built\n', inspect     (info)); })
    .on('msg'        , function (msg)  { log.silly  ('images', 'msg', msg); })
    .on('warn'       , function (err)  { log.warn   ('images', 'warn', err); })
    .on('error'      , function (err)  { log.error  ('images', 'error', err); });

  buildImages(images, opts, tags, function (err, res) {
     if (err) return cb(err);
     cb(null, res);
  });
}
