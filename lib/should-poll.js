'use strict';

var Promise = require('promise');
var buildBundle = require('./build-bundle');
var fs = require('fs');
var tmp = require('tmp');
var watchify = require('watchify');

function shouldPoll() {

  return new Promise(function(resolve, reject) {
    var file = tmp.fileSync();

    var bundle = buildBundle(file.name, {});
    watchify(bundle, { poll: false, delay: 0 });

    var resolved = false;

    function decide(pollEnabled) {
      bundle.close();
      file.removeCallback();
      if (!resolved) {
        resolved = true;
        resolve(pollEnabled);
      }
    }

    bundle.once('bundle', function(b) {
      b.once('error', reject);
      // end event is never fired without having a data
      b.once('data', function() {});
      b.once('end', function() {

        bundle.once('update', function() {
          decide(true);
        });

        setTimeout(decide, 1000, false);

        fs.appendFileSync(file.name, 'var a = 1;');
      });
    });

    bundle.once('error', reject);
    bundle.bundle();
  });

}

module.exports = shouldPoll;
