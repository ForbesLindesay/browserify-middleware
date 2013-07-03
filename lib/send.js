var browserify = require('browserify');
var uglify = require('uglify-js');
var join = require('path').join;
var zlib = require('zlib');
var crypto = require('crypto');
var fs = require('fs');

function minify(str) {
  return uglify.minify(str, {fromString: str});
}

function bundleFile(path, options) {
  return browserify({entries: [path], noParse: options.noParse});
}
function bundleModule(modules, options) {
  var b = browserify({noParse: options.noParse});
  for (var i = 0; i < modules.length; i++) {
    b.require(modules[i]);
  }
  return b;
}

var dynamicCache = {};
var dynamicCacheTime = {};
var dynamicCacheCallbacks = [];
function updateDynamicCache(callback) {
  var cached = Object.keys(dynamicCacheTime);
  var remaining = cached.length;
  if (0 === remaining) {
    return callback()
  }
  if (dynamicCacheCallbacks.length) {
    return dynamicCacheCallbacks.push(callback)
  }
  dynamicCacheCallbacks.push(callback)
  cached.forEach(function (file) {
    if (!(file in dynamicCache)) return;
    fs.stat(file, function (err, stats) {
      if (err || stats.mtime.getTime() !== dynamicCacheTime[file]) {
        if (file in dynamicCache) {
          delete dynamicCache[file];
        }
        if (file in dynamicCacheTime) {
          delete dynamicCacheTime[file];
        }
      }
      if (0 === --remaining) {
        for (var i = 0; i < dynamicCacheCallbacks.length; i++) {
          dynamicCacheCallbacks[i]();
        }
        dynamicCacheCallbacks = [];
      }
    })
  });
}
function compile(path, options, cb, cacheUpdated) {
  cb = guard(cb);
  if (options.cache === 'dynamic' && !cacheUpdated) {
    updateDynamicCache(function () { compile(path, options, cb, true) })
  }
  var b = Array.isArray(path) ? bundleModule(path, options) : bundleFile(path, options);
  if (options.cache === 'dynamic') {
    b.on('dep', function (dep) {
      fs.stat(dep.id, function (err, stats) {
        if (err) return;
        dynamicCache[dep.id] = dep
        dynamicCacheTime[dep.id] = stats.mtime.getTime()
      })
    })
  }
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
    standalone: options.standalone || false,
    cache: (options.cache === 'dynamic' ? dynamicCache : {})
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
        cb(null, new Buffer(src), res, md5(src));
      });
    } else {
      cb(null, new Buffer(src), null, md5(src));
    }
  }));
}

var start = new Date().toUTCString();
var cache = {};
var zipCache = {};
var tagCache = {};

function cachedCompile(path, options, cb) {
  if (!options.cache || options.cache === 'dynamic') return compile(path, options, cb);
  var cacheKey = JSON.stringify(path);
  if (cache[cacheKey]) {
    return cb(null, cache[cacheKey], zipCache[cacheKey], tagCache[cacheKey]);
  } else {
    compile(path, options, function (err, src, gzipped, tag) {
      if (err) return cb(err);//don't cache errors
      cache[cacheKey] = src;
      zipCache[cacheKey] = gzipped;
      tagCache[cacheKey] = tag;
      return cb(null, src, gzipped, tag);
    });
  }
}

function md5(str) {
  return crypto.createHash('md5').update(str).digest("hex");
}

module.exports = send;
function send(path, options, req, res, next) {
  cachedCompile(path, options, function (err, src, gzipped, tag) {
    if (err) return next(err);

    try {

      // vary
      if (!res.getHeader('Vary')) {
        res.setHeader('Vary', 'Accept-Encoding');
      } else if (!~res.getHeader('Vary').indexOf('Accept-Encoding')) {
        res.setHeader('Vary', res.getHeader('Vary') + ', Accept-Encoding');
      }

      res.setHeader('content-type', 'text/javascript');

      //check old etag
      if (req.headers['if-none-match'] === tag) {
        res.statusCode = 304;
        res.end();
        return;
      }

      //add new etag
      res.setHeader('ETag', tag);
      res.setHeader('Last-Modified', start);

      //add cache-control
      if (options.cache) {
        res.setHeader('Cache-Control', options.cache);
      }

      //add gzip
      if (options.gzip && supportsGzip(req)) {
        res.setHeader('Content-Encoding', 'gzip');
        src = gzipped;
      }

      //set content-length (src must always be a buffer)
      res.setHeader('Content-Length', src.length);

      //send content
      if ('HEAD' === req.method) res.end();
      else res.end(src);
    } catch (ex) {
      if (!res.headerSent) {
        try { return next(err); } catch (ex) {}
      }
      console.error(ex.stack || ex.message || e);
    }
  });
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