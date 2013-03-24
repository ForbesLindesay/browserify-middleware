var browserify = require('browserify');
var uglify = require('uglify-js');
var join = require('path').join;
var zlib = require('zlib');

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

function compile(path, options, cb) {
    var b = Array.isArray(path) ? bundleModule(path) : bundleFile(path);
    for (var i = 0; i < (options.external || []).length; i++) {
      b.external(options.external[i]);
    }
    for (var i = 0; i < (options.ignore || []).length; i++) {
      b.ignore(options.ignore[i]);
    }
    for (var i = 0; i < (options.ignore || []).length; i++) {
      b.ignore(options.ignore[i]);
    }
    for (var i = 0; i < (options.transform || []).length; i++) {
      b.transform(options.transform[i]);
    }
    b.bundle({
      insertGlobals: options.insertGlobals,
      detectGlobals: options.detectGlobals,
      debug: options.debug
    }, (function (err, src) {
      if (err) return cb(err);
      if (options.minify) {
        try {
          src = minify(src).code;
        } catch (ex) {} //better to just let the client fail to parse
      }
      if (options.gzip) {
        zlib.gzip(src, function (err, res) {
          if (err) return cb(err);
          cb(null, src, res);
        });
      } else {
        cb(null, src);
      }
    }));
}

var start = new Date().toUTCString();
var etag = 'browserify-' + Math.random();
var cache = {};
var zipCache = {};
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
    if (options.gzip && supportsGzip(req)) {
      res.setHeader('Content-Encoding', 'gzip');
      res.end(zipCache[cacheKey]);
    } else {
      res.end(cache[cacheKey]);
    }
  } else {
    compile(path, options, function (err, src, gzipped) {
      if (err) return next(err);
      if (options.cache) {
        cache[cacheKey] = src;
        if (options.gzip) zipCache[cacheKey] = gzipped;
      }
      res.setHeader('content-type', 'text/javascript');
      res.setHeader('Last-Modified', new Date().toUTCString());
      if (options.gzip && supportsGzip(req)) {
        res.setHeader('Content-Encoding', 'gzip');
        res.end(gzipped);
      } else {
        res.end(src);
      }
    });
  }
}

function supportsGzip(req) {
  return req.headers && req.headers['accept-encoding'] && req.headers['accept-encoding'].indexOf('gzip') != -1;
}

function guard(fn) {
  var called = false;
  return function () {
    if (called) return;
    called = true;
    fn.apply(this, arguments);
  };
}