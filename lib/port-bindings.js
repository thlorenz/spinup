'use strict';

module.exports = function portBindings(port, hostPort) {
  var pb = {};
  pb[port + '/tcp'] = [ { "HostPort": ''+hostPort } ];
  return pb;
}
