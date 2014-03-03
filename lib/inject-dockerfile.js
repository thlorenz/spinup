'use strict';

var fs = require('fs')
  , path = require('path')
  , tar = require('tar-stream')
//  , tar = require('tar-fs')


var go = module.exports = function () {
  
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

  extract.on('entry', function (hdr, stream, cb) {
    inspect(hdr);
    var p = pack.entry(hdr, stream, cb)
    if (hdr.type === 'file') stream.pipe(p);
  });
  extract.on('finish', function () {
    pack.entry({
      name  : 'test.txt',
      mtime : new Date(1387580181000),
      mode  : '\u0777',
      uname : 'thlorenz',
      gname : 'users',
      uid   : 501,
      gid   : 20
    }, 'hello world\n');

   
    pack.finalize();
  });

  ins
    .on('error', console.error)
    .pipe(extract);

  pack
    .on('error', console.error)
    .pipe(fs.createWriteStream(resdir + '/out.tar.gz', 'utf8'));
}
