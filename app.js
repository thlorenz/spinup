'use strict';

var fs               = require('fs')
  , path             = require('path')
  , http             = require('http')
  , hyperquest       = require('hyperquest')
  , log              = require('npmlog')
  , runnel           = require('runnel')
  , spinupContainers = require('./spinup-containers')
  , renderIframes    = require('./server/render-iframes')
  , getMyLocalIp     = require('my-local-ip')

log.level = 'verbose';

var myLocalIp = getMyLocalIp();
var indexTemplate = fs.readFileSync(path.join(__dirname, 'server', 'index.html'), 'utf8');

var opts = {
    repo          : 'thlorenz/browserify-markdown-editor'
  , host          : myLocalIp
  , exposePort    : 3000
  , containers    : true
  , reattach      : false
}

function inspect(obj, depth) {
  console.error(require('util').inspect(obj, false, depth || 5, true));
}

function cb () { console.error(arguments) }

function serveHtml(html, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
}

function serveCss (res) {
  res.writeHead(200, { 'Content-Type': 'text/css' });
  fs.createReadStream(path.join(__dirname, 'server', 'index.css')).pipe(res); 
}

function matchMapped(mapped, url) {
  return Object.keys(mapped)
    .filter(function(k) {
      var root = url.slice(0, k.length);
      return root === k;
    })
    .map(function (k) {
      return mapped[k] + url.slice(k.length);
    })[0];
}

function createServer(byPort, cb) {
  var dockerContainers = renderIframes(byPort, opts);
  var indexHtml = indexTemplate.replace(/\{\{docker-containers\}\}/, dockerContainers);

  var server = http.createServer(function (req, res) {
    var root = 'http://0.0.0.0';
    log.http('spinup', '%s %s', req.method, req.url);

    if (req.url === '/') return serveHtml(indexHtml, res);
    if (req.url === '/index.css') return serveCss(res);

    res.writeHead(404);
    res.end();
  })

  cb(null, server);
}

// create containers/reattach to exisiting ones and get info
runnel(
    spinupContainers.bind(null, opts)
  , createServer
  , function (err, server) {
      if (err) return cb(err);

      server.on('listening', function () {
        var a = server.address();
        log.info('spinup', 'listening: http://%s:%d', myLocalIp, a.port); 
      });
      server.listen(3000);
  }
)


// create routes for each repo/tag


// render iframe for each container


// serve index from /
