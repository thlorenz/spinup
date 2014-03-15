'use strict';
/*jshint asi: true */

var test = require('tap').test

var byPort = {
  '49223': 
    { Command: 'node /src/index.js',
      Created: 1394822903,
      Id: 'd89b83b0119a46c77ae4e72ec5a3808730e6d49dacdd494ad624e9900cb7fc6c',
      Image: 'thlorenz/browserify-markdown-editor:005-styled',
      Names: [ '/jovial_babbage' ],
      Ports: 
        [ { IP: '0.0.0.0',
            PrivatePort: 3000,
            PublicPort: 49223,
            Type: 'tcp' } ],
      Status: 'Up 35 minutes' },
  '49224': 
    { Command: 'node /src/index.js',
      Created: 1394822904,
      Id: '9670e1fa26a4896040f8c8c6f72ba8ce806a68b95f29c4b2c23558dbe1dd5900',
      Image: 'thlorenz/browserify-markdown-editor:007-rendering-md-client-side',
      Names: [ '/tender_mclean' ],
      Ports: 
        [ { IP: '0.0.0.0',
            PrivatePort: 3000,
            PublicPort: 49224,
            Type: 'tcp' } ],
      Status: 'Up 35 minutes' },
  '49226': 
    { Command: 'node /src/index.js',
      Created: 1394822905,
      Id: '7cad0c64ad41b3cfe11800a19bd6910f3b208ba86981334d05227dcbef306b06',
      Image: 'thlorenz/browserify-markdown-editor:011-finished-product',
      Names: [ '/jovial_torvalds' ],
      Ports: 
        [ { IP: '0.0.0.0',
            PrivatePort: 3000,
            PublicPort: 49226,
            Type: 'tcp' } ],
      Status: 'Up 35 minutes' } 
}
