var resolve = require('path').resolve;
var cachedCompile = require('./compile');

module.exports = precompiler;

function precompiler(options, cb) {
  return function precompile(path) {
    cachedCompile(resolve(path), options, cb || noop)
  }
}

function noop() {}
