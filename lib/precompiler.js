var cachedCompile = require('./compile');

module.exports = precompiler;

function precompiler(options) {
  return function precompile(path, cb) {
    cachedCompile(path, options, cb || noop)
  }
}

function noop() {}
