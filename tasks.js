'use strict';

var path         = require('path')
  , log          = require('npmlog')
  , docker       = require('./lib/docker')
  , portBindings = require('./lib/port-bindings')
  , Containers   = require('./adw/containers')

var containers = new Containers(docker);

function inspect(obj, depth) {
  console.error(require('util').inspect(obj, false, depth || 5, true));
} 

containers.listStopped(function (err, res) {
  if (err) return console.error(err);
  console.log('stopped');
  inspect(res);
})

/*containers.removeStopped(function (err, res) {
  if (err) return console.error(err);
  inspect(res);  
})*/

/*containers.listRunning(function (err, res) {
  if (err) return console.error(err);
  console.log('alive');
  inspect(res);
})

containers.activePorts(function (err, res) {
  if (err) return console.error(err);
  console.log('ports');
  inspect(res);
})*/
