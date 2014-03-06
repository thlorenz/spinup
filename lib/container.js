'use strict';

var dockerhost = process.env.DOCKER_HOST || 'tcp://127.0.0.1:4243'
var parts      = dockerhost.split(':')
  // dockerode works via sending http requests, so a tcp host won't work :P
  , host       = parts.slice(0, -1).join(':').replace(/^tcp/, 'http')
  , port       = parts[parts.length - 1]

var timeToStop = 500;

// github redirects for tarball downloads, so we need request here
var docker = new require('dockerode')({ host: host, port: port });

function inspect(obj, depth) {
  console.error(require('util').inspect(obj, false, depth || 5, true));
}

function imageName(repo, tag) {
  return repo + ':' + tag;
}

function createContainer(opts, cb) {
  docker.createContainer({
      Image: imageName(opts.repo, opts.tag)
    , AttachStdout: true
    , AttachStderr: true
    , WorkingDir: 'src'
    , Cmd: [ 'ls -la' ]
  }, cb);
}

function foreach(fn, cb) {
  docker.listContainers({ all: true }, function (err, containers) {
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

var opts = {
    repo : 'thlorenz/browserify-markdown-editor'
  , tag : '011-finished-product'
  , port: 3000
}

function report(cb, err, data) {
  if (err) return cb(err);
  if (data) inspect(data);
  cb();
}

function done(err, data) {
  if (err) return console.error(err);
  if (data) inspect(data);
  console.log('success');
}

function clean(cb) {
  console.log('--- cleaning ---');
  foreach(function (info, cb_) {
    inspect(info);
    var container = docker.getContainer(info.Id);
    
    function stop() {
      container.stop(function (err, body) {
        if (err) return kill();
        setTimeout(remove, timeToStop);
      })
    }

    function kill() {
      container.kill(function (err, data) {
        if (err) return stop();
        console.error('Unable to stop, killing', info.Id);
        setTimeout(remove, timeToStop);
      }) 
    }

    function remove() {
      container.remove(function (err, data) {
        if (err) return stop();
        cb_();
      })
    }

    stop();

  }, cb)
}

createContainer(opts, function (err) {
  if (err) return done(err);
  foreach(function (info, cb) {
    inspect(info);
    docker
      .getContainer(info.Id)
      .start({
            PortBindings: { '3000/http': [ { HostPort:42222 } ] }
          , PublishAllPorts: true
          }
        , report.bind(null, cb));
      }
  , clean.bind(null, done));
});

