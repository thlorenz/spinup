'use strict';

var go = module.exports = function (image) {
  return '/' + image.replace(/:/, '/')
}
