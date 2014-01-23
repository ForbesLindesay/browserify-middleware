var cachedCompile = require('./compile');

module.exports = precompiler;

function precompiler(options, cb) {
  return function precompile(path) {
    cachedCompile(path, options, cb || noop)
  }
}

function noop() {}
