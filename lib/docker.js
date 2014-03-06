'use strict';

var dockerhost = process.env.DOCKER_HOST || 'tcp://127.0.0.1:4243'
var parts      = dockerhost.split(':')
  // dockerode works via sending http requests, so a tcp host won't work :P
  , host       = parts.slice(0, -1).join(':').replace(/^tcp/, 'http')
  , port       = parts[parts.length - 1]

exports = module.exports = 
  new require('dockerode')({ host: host, port: port });

exports.imageName = function imageName(repo, tag) {
  return repo + ':' + tag;
}
