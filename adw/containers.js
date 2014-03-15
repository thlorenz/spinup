'use strict';

var util         = require('util')
  , EE           = require('events').EventEmitter
  , xtend        = require('xtend')
  , runnel       = require('runnel')
  , portBindings = require('./port-bindings')

module.exports = Containers;

util.inherits(Containers, EE);

function Containers(docker) {
  if (!(this instanceof Containers)) return new Containers(docker);

  this.docker = docker;
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

proto.listStopped = function (cb) {
  this.listAll(function (err, res) {
    if (err) return cb(err);
    var dead = res.filter(function(x) { 
      return (/^Exit/).test(x.Status) 
    })
    cb(null, dead);
  });
}

proto.listRunning = function (cb) {
  this.listAll(function (err, res) {
    if (err) return cb(err);
    var alive = res.filter(function(x) { 
      return !(/^Exit/).test(x.Status) 
    })
    cb(null, alive);
  });
}

proto.activePorts = function (cb) {
  this.listRunning(function (err, res) {
    if (err) return cb(err);
    var byPort = res.reduce(function (acc, cont) {
      var ports = cont.Ports;
      if (ports && ports.length) {
        ports.forEach(function (p) { acc[p.PublicPort] = cont })
      }
      return acc;
    }, {});
    cb(null, byPort);
  });
}

proto.removeStopped = function (cb) {
  var self = this;

  function remove(id, cb_) {
    var container = self.docker.getContainer(id);
    self.emit('removing', id);
    container.remove(function (err, data) {
      if (err) return cb(err);
      self.emit('removed', id);
      cb_();
    })
  }

  this.listStopped(function (err, res) {
    if (err) return cb(err);
    var tasks = res
      .map(function (x) { 
        return function (cb_) {
          remove(x.Id, cb_);
        }
      })
    runnel(tasks.concat(function (err) {
      if (err) return cb(err);
      cb(res);   
    }))
  })
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
  opts = xtend({ retries: 5 }, opts);
  (function createNstart(retries) {
    self.create(opts.create, function (err, container) {
      if (err) return cb(err);

      container.start(opts.start, function (err, started) {
        if (err) { 
          self.emit(
              'warn'
            , 'failed to start container ' 
              + inspect(opts.start) 
              + ' as ' + container.id 
              + '\nError: ' + err
              + ', retrying'
          );
          return retries > opts.retries  
            ? cb(new Error('Exceeded max retries trying to start container'))
            // cleaning fails currently consistently (for my setup -- arch linux aufs friendly)
            // we leave it in here in the hopes that it works elsewhere and/or in the future
            : self.clean(container.id, createNstart.bind(null, retries + 1))
        }

        cb(null, container);    
      });
    });
  })(0);
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
      if (err) return stopAttempts < maxAttempts ? stop() : cb();
      self.emit('removed', id);
      cb();
    })
  }
  stop();
}
