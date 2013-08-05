var path = require('path');
var normalize = path.normalize;
var resolve = path.resolve;
var dirname = path.dirname;
var callsite = require('callsite');
var stat = require('fs').statSync;

exports = module.exports = browserify;
function browserify(path, options) {
  if (Array.isArray(path)) {
    return exports.modules(path, options);
  }
  if (resolve(path) === normalize(path)) {
    path = normalize(path);
  } else {
    var dir = directory();
    options = exports.settings.normalize(options);
    options.noParse = options.noParse.map(function (path) {
      if (path[0] != '.') return path; //support `['jquery']` as well as `['./src/jquery.js']`
      if (resolve(path) === normalize(path)) {
        return normalize(path);
      } else {
        return resolve(dir, path);
      }
    })
    path = resolve(dir, path);

  }
  if (stat(path).isDirectory()) {
    return exports.directory(path, options);
  } else {
    return exports.file(path, options);
  }
}
exports.directory = require('./lib/directory');
exports.file = require('./lib/file');
exports.modules = require('./lib/modules');

exports.settings = require('./lib/settings');

function directory(exclude) {
  var stack = callsite();
  for (var i = 0; i < stack.length; i++) {
    var filename = stack[i].getFileName();
    if (filename !== __filename && (!exclude || (exclude.indexOf(filename) === -1)))
      return dirname(filename);
  }
  throw new Error('Could not resolve directory');
}
