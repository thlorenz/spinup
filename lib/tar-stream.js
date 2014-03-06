'use strict';

var zlib    = require('zlib')
  , request = require('request')

var tarStream =  module.exports = 

function tarStream(hub, repo, ext, tag) {
  var root = hub + '/' + repo + '/archive'
    , url = root + '/' + tag + ext

  return ext === '.tar.gz' || ext === 'tgz'
    ? request(url).pipe(zlib.createGunzip())
    : request(url);
}

tarStream.github = function githubTarStream(repo, tag) {
  var hub = 'https://github.com'
    , ext = '.tar.gz'

  return tarStream(hub, repo, ext, tag);
}
