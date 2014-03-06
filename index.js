'use strict';


var dockerhost = process.env.DOCKER_HOST || 'tcp://127.0.0.1:4243'
var parts      = dockerhost.split(':')
  // dockerode works via sending http requests, so a tcp host won't work :P
  , host       = parts.slice(0, -1).join(':').replace(/^tcp/, 'http')
  , port       = parts[parts.length - 1]


// github redirects for tarball downloads, so we need request here
var path         = require('path')
  , dockerify    = require('dockerify')
  , tarStream     = require('./lib/tar-stream')
  , stringifyMsg = require('./lib/stringify-msg')

var log = require('npmlog');

var docker = new require('dockerode')({ host: host, port: port });
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

function imageName(repo, tag) {
  return repo + ':' + tag;
}

function buildImage(opts, cb) {
  var stream = tarStream[opts.hub](opts.repo, opts.tag);

  var tarstream = dockerify(stream, { strip: opts.strip, dockerfile: opts.dockerfile });
  tarstream
    .on('error', log.error.bind(log, 'dockerize'))
    .on('entry', function (x) { log.verbose('dockerize', 'processing ', x.name) })
    .on('overriding-dockerfile', function (x) { log.info('dockerize', 'overriding existing dockerfile') })
    .on('existing-dockerfile', function (x) { log.info('dockerize', 'using dockerfile found inside the tarball instead of the one provided, use opts.override:true to change that') })

  docker.buildImage(tarstream, { t: imageName(opts.repo, opts.tag) } , function (err, res) {
    if (err) return cb(err);

    res
      .on('error', cb)
      .on('data', logMsg)
      .on('end', cb);
  });
}

function createContainer(opts, cb) {
  docker.createContainer({
        Image: imageName(opts.repo, opts.tag)
      }
    , cb
  );
}

/*function runImage(opts, cmd, cb) {
  if (!Array.isArray(cmd)) cmd = cmd.split(' ');
  docker.run(imageName(opts.repo, opts.tag), cmd, process.stdout, function (err, data, container) {
    if (err) return console.error(err);
    
    console.log(data.StatusCode);
  });
}*/

var go = module.exports = 

function (opts, cb) {
  opts.hub        = opts.hub || 'github';
  opts.dockerfile = opts.dockerfile || defaultDockerfile;

  /*buildImage({
      hub: 'github'
    , repo : 'thlorenz/browserify-markdown-editor'
    , tag : '011-finished-product'
    , dockerfile: defaultDockerfile
    }
  , function (err) {
    cb(err);
  });*/

 var port = 42222;
 // runImage(opts, '-p ' + port + ':' + port + ' -i -rm npm start');
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
