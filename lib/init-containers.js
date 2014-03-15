'use strict';

var path         = require('path')
  , log          = require('npmlog')
  , runnel       = require('runnel')
  , xtend        = require('xtend')
  , util         = require('util')
  , docker       = require('./docker')
  , portBindings = require('./port-bindings')
  , Containers   = require('../adw/containers')

function inspect(obj, depth) {
  return util.inspect(obj, false, depth || 5, true);
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
  var created = {};
  // todo: async-reduce
  var tasks = tags
    .map(function (tag, idx) {
      return function (cb_) {
        var image = docker.imageName(opts.repo, tag)
          , pb = portBindings(opts.exposePort, opts.hostPortStart + idx);

        containers.run(
          { create : xtend(opts.create, { Image : image })
          , start  : xtend(opts.start, { PortBindings: pb })
          }
        , function (err, container) { 
            if (err) return cb_(err);
            created[container.id] = { 
                container : container
              , image     : image
              , ports     : {
                    exposed: opts.exposePort
                  , host: opts.hostPortStart + idx 
                }
            }
            cb_() 
          }
        );
      }
    })

  runnel(tasks.concat(function (err) {
    if (err) return cb(err);
    cb(null, created);  
  }))
}

module.exports = function initContainers(tags, opts, cb) {
  var containers = new Containers(docker);

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

  containers.on('warn', log.warn.bind(log));
  containers.cleanAll(function (err) {
    if (err) return cb(err);
    runContainers(containers, tags, opts, cb);
  });
}
