'use strict';

var xtend           = require('xtend')
  , imageNameToPath = require('./image-name-to-path')
  

var go = module.exports = function (byPort, opts) {
  opts = xtend({ host: 'localhost', protocol: 'http' }, opts);


  return Object.keys(byPort)
    .reduce(function (acc, k) {
      var val = byPort[k];
      return acc 
        + '<div class="docker-container">'
        +   '<p>' + val.Image + '</p>'
        +   '<iframe src="' +  opts.protocol + '://' + opts.host + ':' + k 
        +   '/"></iframe>\n'
        + '</div>'
        ;
    }, '')    
}
