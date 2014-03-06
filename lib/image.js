'use strict';

var dockerhost = process.env.DOCKER_HOST || 'tcp://127.0.0.1:4243'
var parts      = dockerhost.split(':')
  // dockerode works via sending http requests, so a tcp host won't work :P
  , host       = parts.slice(0, -1).join(':').replace(/^tcp/, 'http')
  , port       = parts[parts.length - 1]


// github redirects for tarball downloads, so we need request here
var docker = new require('dockerode')({ host: host, port: port });

function inspect(obj, depth) {
  console.error(require('util').inspect(obj, false, depth || 5, true));
}

function imageName(repo, tag) {
  return repo + ':' + tag;
}

function foreach(fn, cb) {
  docker.listImages(function (err, images) {
    if (err) return cb(err);
    if (!images.length) return cb();
    images.forEach(fn)
    cb();
  });
}

function done(err) {
  if (err) return console.error(err);
  console.log('success');
}

foreach(inspect, done);
