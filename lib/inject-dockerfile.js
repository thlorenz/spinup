'use strict';

var fs = require('fs')
  , path = require('path')
  , tar = require('tar-stream')


var go = module.exports = 

/**
 * Takes the given tar stream and injects a Docker file.
 * 
 * @name injectDockerFile
 * @function
 * @param {ReadableStream} tarballStream of the original tarball
 * @return {ReadableStream} with the Dockerfile injected 
 */
function injectDockerFile(tarballStream) {
  var pack = tar.pack()
    , extract = tar.extract();
  
  extract
    .on('entry', function (hdr, stream, cb) {
      inspect(hdr);
      var p = pack.entry(hdr, stream, cb)
      if (hdr.type === 'file') stream.pipe(p);
    })
    .on('finish', function () {
      pack.entry(
        { name  : 'Dockerfile'
        , mtime : new Date()
        , mode  : parseInt('644', 8)
        , uname : 'thlorenz'
        , gname : 'users'
        , uid   : 501
        , gid   : 20
        }
      , 'from dockerfile/nodejs\n');

      pack.finalize();
    });

  tarballStream.on('error', console.error).pipe(extract);
  return pack;
};

function inspect(obj, depth) {
  console.error(require('util').inspect(obj, false, depth || 5, true));
}

// Test
if (!module.parent && typeof window === 'undefined') {
  var dir = path.join(__dirname, '..', 'tmp');  
  var resdir = path.join(__dirname, '..', 'result');  
  var pack = tar.pack();
  var extract = tar.extract();

  var ins = fs.createReadStream(dir + '/in.tar.gz', 'utf8');

  go(ins)
    .on('error', console.error)
    .pipe(fs.createWriteStream(resdir + '/out.tar.gz', 'utf8'));
}