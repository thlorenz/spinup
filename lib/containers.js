'use strict';

var util = require('util')
  , EE = require('events').EventEmitter;

module.exports = Containers;

util.inherits(Containers, EE);

function Containers(docker) {
  if (!(this instanceof Containers)) return new Containers(docker);

  this.docker = docker || require('./docker');
  this.timeToStop = 500; 
  this.timeToCreate = 500;

  this.defaultOpts = {
      AttachStdout: true
    , AttachStderr: true
    , WorkingDir: 'src'
    , Cmd: [ 'ls -la' ]
  }
  this.defaultStartOpts = {
    PortBindings: { '3000/http': [ { HostPort:42222 } ] }
  , PublishAllPorts: true
  }
}

var proto = Containers.prototype;

proto.list = function (all, cb) {
  if (typeof all === 'function') {
    cb = all;
    all = false;
  }
  this.docker.listContainers({ all: all }, cb);
}

proto.listAll = function (cb) { 
  this.list(true, cb);
}

proto.forEach = function forEach(fn, cb) {
  this.listAll(function (err, containers) {
    if (err) return cb(err);

    var tasks = containers.length;
    if (!tasks) return cb();

    containers.forEach(function (x) { 
      fn(x, function (err) {
        if (err) return cb(err);
        if (!--tasks) cb(); 
      })
    })
  })
}

proto.create = function createContainer(opts, cb) {
  var self = this;
  var repo = opts.repo
    , tag  = opts.tag;

  opts = this.defaultOpts; // todo: xtend
  opts.Image = this.docker.imageName(repo, tag);

  self.emit('creating', opts);
  self.docker.createContainer(opts, function (err, info) {
    if (err) return cb(err);
    self.emit('created', info);
    setTimeout(cb.bind(null, null, info), self.timeToCreate);
  });
}

proto.cleanAll = function cleanAllContainers(cb) {
  var self = this;
  self.forEach(function (info, cb_) {
    self.clean(info.Id, cb_);
  }, cb);
}

proto.start = function (id, opts, cb) {
  var self = this;

  opts = this.defaultStartOpts; // todo xtend
  self.emit('starting', opts);
  self.docker
    .getContainer(id)
    .start(opts,  function (err) {
      // todo: try starting again in a bit until max tries is reached
      if (err) return cb(err);
      self.emit('started', { id: id, opts: opts });
      cb();
    });
}

proto.startAll = function (getOpts, cb) {
  var self = this;
  self.forEach(function (info, cb_) {
    self.start(info.Id, getOpts(info), cb_);
  }, cb)
}

proto.clean = function cleanContainer(id, cb) {
  var self = this;
  var stopAttempts = 0
    , killAttempts = 0;

  var container = self.docker.getContainer(id);
  
  function stop() {
    self.emit('stopping', id);
    stopAttempts++;
    container.stop(function (err, body) {
      if (err) return kill();
      self.emit('stopped', { id: id, attempts: stopAttempts });
      setTimeout(remove, self.timeToStop);
    })
  }

  function kill() {
    self.emit('killing', id);
    killAttempts++;
    container.kill(function (err, data) {
      if (err) return stop();
      self.emit('killed', { id: id, attempts: killAttempts });
      setTimeout(remove, self.timeToStop);
    }) 
  }

  function remove() {
    self.emit('removing', id);
    container.remove(function (err, data) {
      if (err) return stop();
      self.emit('removed', id);
      cb();
    })
  }
  stop();
}


// TESTING
function inspect(obj, depth) {
  return util.inspect(obj, false, depth || 5, true);
}

var log = require('npmlog');
//log.level = 'silly';

var opts = {
    repo : 'thlorenz/browserify-markdown-editor'
  , tag : '011-finished-product'
  , port: 3000
}

function done(err, data) {
  if (err) return console.error(err);
  if (data) inspect(data);
  console.log('success');
}

var co = new Containers();

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

co.cleanAll(oncleaned);

function oncleaned(err) {
  if (err) return console.error(err);
  co.create(opts, oncreated);
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
