var browserify = require('browserify');
var uglify = require('uglify-js');
var join = require('path').join;
var zlib = require('zlib');
var crypto = require('crypto');

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
  cb = guard(cb);
  var b = Array.isArray(path) ? bundleModule(path) : bundleFile(path);
  for (var i = 0; i < (options.external || []).length; i++) {
    b.external(options.external[i]);
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
    ignoreMissing: options.ignoreMissing,
    debug: options.debug,
    standalone: options.standalone || false
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

function md5(str) {
  return crypto.createHash('md5').update(str).digest("hex");
}

var start = new Date().toUTCString();
var cache = {};
var zipCache = {};
var tagCache = {};
module.exports = send;
function send(path, options, req, res, next) {
  var cacheKey = JSON.stringify(path);
  var tag = tagCache[cacheKey];
  if (options.cache) {
    if (etag(req, tag, res)) return;
    res.setHeader('Cache-Control', 'public, max-age=60');
  }
  if (options.cache && cache[cacheKey]) {
    res.setHeader('ETag', tag);
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
      try {
        if (options.cache) {
          tag = tagCache[cacheKey] = md5(src)
          if (etag(req, tag, res)) return;
          res.setHeader('ETag', tag);
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
      } catch (ex) {
        //better to silence than crash the server
        //probably never actually hit this
        console.error(ex.stack || ex.message || ex);
      }
    });
  }
}

function etag(req, tag, res) {
  if (tag && req.headers['if-none-match'] === tag) {
    res.statusCode = 304;
    res.end();
    return true;
  } else {
    return false;
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