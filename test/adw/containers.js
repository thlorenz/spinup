'use strict';
/*jshint asi: true */

var test = require('tap').test

function inspect(obj, depth) {
  return util.inspect(obj, false, depth || 5, true);
}

function done(err, data) {
  if (err) return console.error(err);
  if (data) inspect(data);
  console.log('success');
}

function oncleaned(err) {
  if (err) return console.error(err);

  var image = require('./docker').imageName(opts.repo, opts.tag);
  co.create({ Image: image }, oncreated);
}

function oncreated(err, info) {
  if (err) return console.error(err);
  start();
}

function start() {
  function getOpts (info) { return opts }
  co.startAll(getOpts, onstarted);
}

function onstarted(err) {
  if (err) return console.error(err);
  co.listAll(onlisted);
}

function onlisted(err) {
  co.cleanAll(done);
}

function run() {
  var image = require('./docker').imageName(opts.repo, opts.tag)
    , pb = require('./port-bindings')(opts.port);

  var opts_ = { 
      create : { Image : image }
    , start  : { PortBindings: pb }
  }

  co.run(opts_, function (err) {
    if (err) return console.error(err);
    console.log('ran');
  });
}

var co = new Containers();
var log = require('npmlog');
log.level = 'silly';

var opts = {
    repo : 'thlorenz/browserify-markdown-editor'
  , tag : '010-finished-dev-version'
  , port: 3000
};


[ 'creating'
, 'starting'
, 'stopping'
, 'killing' 
, 'removing' 
].forEach(function (x) {
    co.on(x, function (info) {
      log.verbose('containers', x + '\n', inspect(info));
    })
  });

[ 'created'
, 'started'
, 'stopped'
, 'killed' 
, 'removed' 
].forEach(function (x) {
    co.on(x, function (info) {
      log.info('containers', x + '\n', inspect(info));
    })
  });

co.on('warn', log.warn.bind(log));

//co.cleanAll(oncleaned);
co.cleanAll(run);
