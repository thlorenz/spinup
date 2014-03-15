'use strict';

var runnel           = require('runnel')
  , spinupContainers = require('./spinup-containers')
  , renderIframes    = require('./server/render-iframes')
  , forwardTagRoutes = require('./server/forward-tag-routes')

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

function setupServer(byPort, cb) {
  var iframes = renderIframes(byPort, opts);
  var routeMap = forwardTagRoutes(byPort, opts);
  console.log(iframes)
  inspect(routeMap);
}

// create containers/reattach to exisiting ones and get info
runnel(
    spinupContainers.bind(null, opts)
  , setupServer
  , function (err) {
      if (err) return cb(err);
      console.log('done')
  }
)


// create routes for each repo/tag


// render iframe for each container


// serve index from /
