'use strict';

// github redirects for tarball downloads, so we need request here
var path         = require('path')
  , dockerify    = require('dockerify')
  , tarStream    = require('./lib/tar-stream')
  , stringifyMsg = require('./lib/stringify-msg')
  , images       = require('./lib/images')()
  , containers   = require('./lib/containers')()

var log = require('npmlog');

var docker = require('./lib/docker');
var dir = console.dir.bind(console);

var defaultDockerfile = path.join(__dirname, 'lib', 'Dockerfile');

function inspect(obj, depth) {
  console.error(require('util').inspect(obj, false, depth || 5, true));
}

function logMsg (chunk) {
  log.info('spinup', stringifyMsg(chunk));
}

function localTarStream() {
  var fs = require('fs');
  return fs.createReadStream(__dirname + '/tmp/in.tar.gz', 'utf8').pipe(require('zlib').createGunzip());
}

var go = module.exports = 

function (opts, cb) {
  opts.hub        = opts.hub || 'github';
  opts.dockerfile = opts.dockerfile || defaultDockerfile;

  images.build({
      hub: 'github'
    , repo : 'thlorenz/browserify-markdown-editor'
    , tag : '011-finished-product'
    , dockerfile: defaultDockerfile
    , tarStream : localTarStream()
    }
  , function (err, res) {
      inspect({ err: err, res: res });    
    }  
  )

 var port = 42222;
 //containers.create(opts, cb);
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
    , tag : '011-finished-product'
    , port: 3000
  }

  go(opts, function (err) {
    if (err) return console.error(err);
    console.log('done');  
  });
}
