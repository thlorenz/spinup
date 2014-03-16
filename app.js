'use strict';

var http             = require('http')
  , hyperquest       = require('hyperquest')
  , log              = require('npmlog')
  , runnel           = require('runnel')
  , spinupContainers = require('./spinup-containers')
  , renderIframes    = require('./server/render-iframes')
  , forwardTagRoutes = require('./server/forward-tag-routes')

log.level = 'silly';

var opts = {
    repo          : 'thlorenz/browserify-markdown-editor'
  , hostPortStart : 49222
  , exposePort    : 3000
//    , images        : true
//    , containers    : true
  , reattach: true
}

function inspect(obj, depth) {
  console.error(require('util').inspect(obj, false, depth || 5, true));
}

function cb () { console.error(arguments) }

function serveHtml(html, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
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
  var iframes = renderIframes(byPort, opts);
  var routeMap = forwardTagRoutes(byPort, opts);
  var indexHtml = [
      '<html>'
    , ' <body>'
    , iframes
    , ' </body>'
    , '</html>'
  ].join('\n') 

  var server = http.createServer(function (req, res) {
    var root = 'http://0.0.0.0';
    log.http('spinup', '%s %s', req.method, req.url);
    if (req.url === '/') return serveHtml(indexHtml, res);
    var mapped = matchMapped(routeMap, req.url);
    if (mapped) {
      var reroute = root + ':' + mapped;
      log.verbose('spinup', 'rerouting to ' + reroute);
      return hyperquest(reroute).pipe(res);
    }
    
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
        log.info('spinup', 'listening: http://%s:%d', a.address, a.port); 
      });
      server.listen(3000);
  }
)


// create routes for each repo/tag


// render iframe for each container


// serve index from /
