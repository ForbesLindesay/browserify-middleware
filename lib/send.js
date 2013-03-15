var browserify = require('browserify');
var uglify = require('uglify-js');
var join = require('path').join;
var rimraf = require('rimraf').sync;
var mkdirp = require('mkdirp').sync;
var cache = join(__dirname, '..', 'cache');
rimraf(cache);
mkdirp(cache);

function minify(str) {
  return uglify.minify(str, {fromString: str});
}

function bundleFile(path) {
  return browserify([path]);
}
function bundleModule(modules) {
  var b = browserify();
  for (var i = 0; i < modules.length; i++) {
    b.require(modules[i]);
  }
  return b;
}

module.exports = send;
function send(path, options, res, next) {
  var b = Array.isArray(path) ? bundleModule(path) : bundleFile(path);
  b.bundle({
    insertGlobals: options.insertGlobals,
    detectGlobals: options.detectGlobals,
    debug: options.debug
  }, (function (err, src) {
    if (err) return next(err);
    if (options.minify) {
      try {
        src = minify(src).code;
      } catch (ex) {} //better to just let the client fail to parse
    }
    res.setHeader('content-type', 'text/javascript');
    res.end(src);
  }));
}

function guard(fn) {
  var called = false;
  return function () {
    if (called) return;
    called = true;
    fn.apply(this, arguments);
  };
}