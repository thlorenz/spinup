'use strict';

// github redirects for tarball downloads, so we need request here
var path         = require('path')
  , dockerify    = require('dockerify')
  , runnel       = require('runnel')
  , xtend        = require('xtend')
  , util         = require('util')
  , tarStream    = require('./lib/tar-stream')
  , docker       = require('./lib/docker')
  , stringifyMsg = require('./lib/stringify-msg')
  , portBindings = require('./lib/port-bindings')
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
  opts = xtend({ 
      hub        : 'github'
    , strip      : 1
    , dockerfile : defaultDockerfile
  }, opts);
  
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

function initImages(tags, opts, cb) {
  var images = new Images()

  images
    .on('processing', function (info) {
      log.silly('images', 'processing\n', inspect(info));
    }) 
    .on('building', function (info) {
      log.verbose('images', 'building\n', inspect(info));
    }) 
    .on('built', function (info) {
      log.info('images', 'built\n', inspect(info));
    }) 
    .on('msg', function (msg) {
      log.silly('images', 'msg', msg);
    })
    .on('error', function (err) {
      log.error('images', 'error', err);
    });

  buildImages(images, opts, tags, function (err, res) {
     if (err) return cb(err);
     cb(null, res);
  });
}

function createContainers(containers, tags, opts, cb) {
  var tasks = tags
    .map(function (x) {
      return function (cb_) {
        containers.create(xtend(opts, { tag: x }), cb_);
      }
    })

  runnel(tasks.concat(cb));
}

function runContainers(containers, tags, opts, cb) {
  opts = xtend({
      hostPortStart: 49222
    , exposePort: 8080
  }, opts);
  var tasks = tags
    .map(function (tag, idx) {
      return function (cb_) {
        var image = docker.imageName(opts.repo, tag)
          , pb = portBindings(opts.exposePort, opts.hostPortStart + idx);

        containers.run(
          { create : xtend(opts.create, { Image : image })
          , start  : xtend(opts.start, { PortBindings: pb })
          }
        , function (err) { 
            // todo catch error in containers.run and remove container
            if (err) console.error(err);
            cb_() 
          }
        );
      }
    })

  runnel(tasks.concat(cb));
}

function initContainers(tags, opts, cb) {
  var containers = new Containers();

  [ 'creating'
  , 'starting'
  , 'stopping'
  , 'killing' 
  , 'removing' 
  ].forEach(function (x) {
      containers.on(x, function (info) {
        log.verbose('containers', x + '\n', inspect(info));
      })
    });

  [ 'created'
  , 'started'
  , 'stopped'
  , 'killed' 
  , 'removed' 
  ].forEach(function (x) {
      containers.on(x, function (info) {
        log.info('containers', x + '\n', inspect(info));
      })
    });

  containers.cleanAll(function (err) {
    if (err) return cb(err);
    runContainers(containers, tags, opts, cb);
  });
//  runContainers(containers, tags, opts, cb);
}

var go = module.exports = function (opts, cb) {
  if (opts.images && opts.containers) {
    initImages(refs.tags, opts, function (err) {
      if (err) return cb(err);
      console.log('inited images');
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

  log.level = 'verbose';
  go(opts, function (err) {
    if (err) return console.error(err);
    console.log('done');  
  });
}
