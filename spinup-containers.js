'use strict';

var path             = require('path')
  , util             = require('util')
  , spinupTarstreams = require('spinup-tarstreams')
  , dockerifyRepo    = require('dockerify-github-repo')

var log = require('npmlog');

function inspect(obj, depth) {
  return util.inspect(obj, false, depth || 5, true);
}

function launch(opts, streamfns, cb) {
  spinupTarstreams(streamfns, opts, cb);
}

function init(opts, cb) {
  dockerifyRepo(
      opts.repo
    , opts 
    , function (err, streamfns) {
        if (err) return cb(err);
        launch (opts, streamfns, cb);
      }
  );
}

var go = module.exports = function (opts, cb) {
  return init(opts, cb);
}

// Test
function filter(tag) {
  //return tag !== '001-start';
  return tag === '009-improved-styling' || tag === '010-finished-dev-version';
}

if (!module.parent && typeof window === 'undefined') {
  var opts = {
      repo       : 'thlorenz/browserify-markdown-editor'
    , group      : 'bmarkdown-test'
    , loglevel   : 'silly'
    , filter    : filter
    , container: { exposePort : 3000 }
    , dockerfile : path.join(__dirname, 'test', 'fixtures', 'Dockerfile')
  }

  log.level = 'silly';
  go(opts, function (err, active) {
    if (err) return console.error(err);
    console.log(inspect(active));
  });
}
