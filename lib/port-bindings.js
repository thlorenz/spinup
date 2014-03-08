'use strict';

module.exports = function portBindings(exposePort, hostPort) {
  var pb = {};
  pb[exposePort + '/tcp'] = [ { "HostPort": ''+hostPort } ];
  return pb;
}
