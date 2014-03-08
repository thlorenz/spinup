'use strict';

var util         = require('util')
  , EE           = require('events').EventEmitter
  , xtend        = require('xtend')
  , portBindings = require('./port-bindings')

module.exports = Containers;

util.inherits(Containers, EE);

function Containers(docker) {
  if (!(this instanceof Containers)) return new Containers(docker);

  this.docker = docker || require('./docker');
  this.timeToStop = 500; 
  this.timeToCreate = 500;

  this.defaultCreateOpts = {
      AttachStdout: true
    , AttachStderr: true
    , WorkingDir: 'src'
  }
  this.defaultStartOpts = {
    PublishAllPorts: true
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

  opts = xtend(this.defaultCreateOpts, opts);

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

  opts = xtend(this.defaultStartOpts, opts);
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

proto.run = function(opts, cb) {
  var self = this;
  opts = opts || {};
  console.log(inspect(opts));
  self.create(opts.create, function (err, container) {
    if (err) return cb(err);
    container.start(opts.start, cb);
  });
}

proto.clean = function cleanContainer(id, cb) {
  var maxAttempts = 5;
  var self = this;
  var stopAttempts = 0
    , killAttempts = 0;

  var container = self.docker.getContainer(id);
  
  function stop() {
    stopAttempts++;
    if (stopAttempts > maxAttempts) {
      self.emit('warn', 'exceeded max stop attempts for [' + id + '], giving up')
      return remove();
    }

    self.emit('stopping', id);
    container.stop(function (err, body) {
      if (err) return kill();
      self.emit('stopped', { id: id, attempts: stopAttempts });
      setTimeout(remove, self.timeToStop);
    })
  }

  function kill() {
    killAttempts++;
    if (killAttempts > maxAttempts) {
      self.emit('warn', 'exceeded max kill attempts for [' + id + '], giving up')
      return remove();
    }

    self.emit('killing', id);

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

if (!module.parent && typeof window === 'undefined') {
    
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

  //co.cleanAll(oncleaned);
  co.cleanAll(run);
}
