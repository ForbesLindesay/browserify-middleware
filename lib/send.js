var browserify = require('browserify');
var uglify = require('uglify-js');
var join = require('path').join;

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

var start = new Date().toUTCString();
var etag = 'browserify-' + Math.random();
var cache = {};
module.exports = send;
function send(path, options, req, res, next) {
  var cacheKey = JSON.stringify(path);
  if (options.cache) {
    if (req.headers['if-none-match'] === etag) {
      res.statusCode = 304;
      res.end();
      return;
    }
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'public, max-age=60');
  }
  if (options.cache && cache[cacheKey]) {
    res.setHeader('Last-Modified', start);
    res.setHeader('content-type', 'text/javascript');
    res.end(cache[cacheKey]);
  } else {
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
      if (options.cache) cache[cacheKey] = src;
      res.setHeader('content-type', 'text/javascript');
      res.setHeader('Last-Modified', new Date().toUTCString());
      res.end(src);
    }));
  }
}

function guard(fn) {
  var called = false;
  return function () {
    if (called) return;
    called = true;
    fn.apply(this, arguments);
  };
}