'use strict';

var xtend           = require('xtend')
  , imageNameToPath = require('./image-name-to-path')

var go = module.exports = function (byPort, opts) {
  opts = xtend({ host: 'localhost', port: '3000', protocol: 'http' }, opts);

  return Object.keys(byPort)
    .reduce(function (acc, k) {
      var val = byPort[k];      
      var path = imageNameToPath(val.Image);

      acc[path] = k;
      return acc;
    }, {});
}
