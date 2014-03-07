'use strict';

var util         = require('util')
  , EE           = require('events').EventEmitter
  , dockerify    = require('dockerify')
  , stringifyMsg = require('./stringify-msg')
  , tarStream    = require('./tar-stream')

module.exports = Images; 

function Images(docker) {
  if (!(this instanceof Images)) return new Images(docker);

  this.docker = docker || require('./docker');
}
util.inherits(Images, EE);
 
var proto = Images.prototype;

proto.buildStream = function (tarstream, opts, cb) {
  var self = this;

  self.docker.buildImage(
      tarstream
    , { t: self.docker.imageName(opts.repo, opts.tag) }
    , function (err, res) {
        if (err) return cb(err);
        res
          .on('error', cb)
          .on('end', cb)
          .on('data', function (d) { self.emit('msg', stringifyMsg(d)) });
      }
  );
}

proto.build = function (opts, cb) {
  var self = this;
  var stream = opts.tarStream || tarStream[opts.hub](opts.repo, opts.tag);
  var tarstream = dockerify(stream, { strip: opts.strip, dockerfile: opts.dockerfile });

  self.emit('building', opts);
  tarstream
    .on('error', cb)
    .on('entry', self.emit.bind(self, 'processing'))
    .on('overriding-dockerfile', function (x) { 
      self.emit('msg', 'overriding existing dockerfile') 
    })
    .on('existing-dockerfile', function (x) { 
      self.emit('msg', 'using dockerfile found inside the tarball instead of the one provided, use opts.override:true to change that') 
    })
    .on('end', function () {
      self.emit('built', opts);
    });

  self.buildStream(tarstream, opts, cb);
}

proto.listAll = function (cb) {
  this.docker.listImages(cb);
}

proto.forEach = function forEach(fn, cb) {
  this.listAll(function (err, images) {
    if (err) return cb(err);

    var tasks = images.length;
    if (!tasks) return cb();

    images.forEach(function (x) { 
      fn(x, function (err) {
        if (err) return cb(err);
        if (!--tasks) cb(); 
      })
    })
  })
}

// TEST 
function done(err) {
  if (err) return console.error(err);
  console.log('success');
}

function inspect(obj, depth) {
  console.error(require('util').inspect(obj, false, depth || 5, true));
}

// Test
if (!module.parent && typeof window === 'undefined') {
  var img = new Images();
  img.forEach(inspect, done);
}
