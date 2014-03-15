'use strict';

// github redirects for tarball downloads, so we need request here
var path         = require('path')
  , util         = require('util')
  , docker       = require('./lib/docker')
  , initImages   = require('./lib/init-images')
  , initContainers = require('./lib/init-containers')

var log = require('npmlog');

var docker = require('./lib/docker');
var defaultDockerfile = path.join(__dirname, 'lib', 'Dockerfile');

function inspect(obj, depth) {
  return util.inspect(obj, false, depth || 5, true);
}

var go = module.exports = function (opts, cb) {
  if (opts.images && opts.containers) {
    initImages(refs.tags, opts, function (err) {
      if (err) return cb(err);
      initContainers(refs.tags, opts, cb);
    })
  } else if (opts.images) {
    initImages(refs.tags, opts, cb);
  } else if (opts.containers) {
    initContainers(refs.tags, opts, cb);
  }
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
  }

  log.level = 'silly';
  go(opts, function (err, created) {
    if (err) return console.error(err);
    console.log(inspect(created));
  });
}
