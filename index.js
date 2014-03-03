'use strict';


var dockerhost = process.env.DOCKER_HOST || 'tcp://127.0.0.1:4243'
var parts      = dockerhost.split(':')
  // dockerode works via sending http requests, so a tcp host won't work :P
  , host       = parts.slice(0, -1).join(':').replace(/^tcp/, 'http')
  , port       = parts[parts.length - 1]

// github redirects for tarball downloads, so we need request here
var request = require('request')
  , injectDockerfile = require('./lib/inject-dockerfile')

var docker = new require('dockerode')({ host: host, port: port });
var dir = console.dir.bind(console);

var gunzip = require('zlib').createGunzip();

var go = module.exports = 
function () {

  var url = 'https://github.com/thlorenz/browserify-markdown-editor/archive/011-finished-product.tar.gz';
  var stream = request(url).pipe(gunzip);

  injectDockerfile(stream, { removeRootDir: true })
    .pipe(require('fs').createWriteStream(__dirname + '/result/product.tar', 'utf8'));
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
  go();
}

