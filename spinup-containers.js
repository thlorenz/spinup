'use strict';

// github redirects for tarball downloads, so we need request here
var path         = require('path')
  , util         = require('util')
  , docker       = require('./lib/docker')
  , initImages   = require('./lib/init-images')
  , initContainers = require('./lib/init-containers')
  , Containers = require('./adw/containers')

var log = require('npmlog');

var docker = require('./lib/docker');
var defaultDockerfile = path.join(__dirname, 'lib', 'Dockerfile');

function inspect(obj, depth) {
  return util.inspect(obj, false, depth || 5, true);
}

function getActivePorts(cb) {
  var containers = new Containers(docker);
  containers.activePorts(cb);
}

function init(opts, cb) {
  if (opts.images && opts.containers) {
    initImages(refs.tags, opts, function (err) {
      if (err) return cb(err);
      initContainers(refs.tags, opts, done);
    })
  } else if (opts.images) {
    initImages(refs.tags, opts, done);
  } else if (opts.containers) {
    initContainers(refs.tags, opts, done);
  }

  function done(err) {
    if (err) return cb(err);
    getActivePorts(cb);
  }
}

var go = module.exports = function (opts, cb) {
  return opts.reattach ? getActivePorts(cb) : init(opts, cb);
}

var refs = { 
  heads: [ 'gh-pages', 'master' ],
  //tags: [ '004-rendering-markdown-on-server' ],
  tags:
   [ 
     //'000-nstarted',
     //'001-start',
     //'002-main',
     //'003-static-server',
       '004-rendering-markdown-on-server',
      '005-styled',
       //'006-dynamic-bundle',
      '007-rendering-md-client-side',
     //'008-updating-on-edit-in-realtime',
      '009-improved-styling',
     //'010-finished-dev-version',
     '011-finished-product' 
  ],
  pulls: [ '1/head' ] 
}

// Test
if (!module.parent && typeof window === 'undefined') {
  var opts = {
      repo          : 'thlorenz/browserify-markdown-editor'
    , hostPortStart : 49222
    , exposePort    : 3000
//    , images        : true
    , containers    : true
    , reattach: false
  }

  log.level = 'silly';
  go(opts, function (err, active) {
    if (err) return console.error(err);
    console.log(inspect(active));
  });
}
