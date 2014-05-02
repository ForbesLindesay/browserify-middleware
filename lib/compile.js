var browserify = require('browserify');
var uglify = require('uglify-js');
var moldSourceMap = require('mold-source-map');
var relative = require('path').relative;
var zlib = require('zlib');
var crypto = require('crypto');
var fs = require('fs');

var DynamicCache = require('./dynamic-cache.js');
//START Compile
var dynamicCache = {};

var cache = {};
var zipCache = {};
var tagCache = {};

function bundleFile(path, options) {
  return browserify({entries: [path], noParse: options.noParse, extensions: options.extensions, resolve: options.resolve, basedir: options.basedir});
}
function bundleModule(modules, options) {
  var b = browserify({noParse: options.noParse, extensions: options.extensions, resolve: options.resolve, basedir: options.basedir});
  for (var i = 0; i < modules.length; i++) {
    if (typeof modules[i] === 'object') { // obj spec support; i.e. {"jquery": {options...}}
      var spec = modules[i];
      var keys = Object.keys(spec);
      keys.forEach(function (key) {
        b.require(key, spec[key]);
      })
    } else {
      b.require(modules[i]);
    }
  }
  return b;
}

function transformSourcesRelativeTo(source, basedir) {
  var sourceMolder = moldSourceMap.fromSource(source);
  sourceMolder.mapSources(function (file) {
    // add leading space here since devtools cuts off first char
    return '/' + relative(basedir, file).replace(/\\/g, '/');
  });
  return sourceMolder.replaceComment();
}

function unixifySourceMap(source) {
  var sourceMolder = moldSourceMap.fromSource(source);
  sourceMolder.mapSources(function (file) {
    return file.replace(/\\/g, '/').replace(/^([A-Z]):\//, '/$1/');
  });
  return sourceMolder.replaceComment();
}

function md5(str) {
  return crypto.createHash('md5').update(str).digest("hex");
}

function minify(str, options) {
  if (!options || typeof options !== 'object') options = {};
  options.fromString = true;
  return uglify.minify(str, options);
}

function guard(fn) {
  var called = false;
  return function () {
    if (called) return;
    called = true;
    fn.apply(this, arguments);
  };
}

function compile(path, options, cb, cacheUpdated) {
  cb = guard(cb);
  var cache;
  if (options.cache === 'dynamic') {
    cache = dynamicCache[path + ':' + options.external + ':' + options.debug];
    if (cache && !cacheUpdated) {
      return cache.update(function () { compile(path, options, cb, true) });
    } else if (!cache) {
      cache = (dynamicCache[path + ':' + options.external + ':' + options.debug] = new DynamicCache());
    }
  }
  var b = Array.isArray(path) ? bundleModule(path, options) : bundleFile(path, options);
  if (options.cache === 'dynamic') {
    b.on('dep', function (dep) {
      cache.add(dep);
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
    cache: (options.cache === 'dynamic' ? cache.getCache() : {})
  }, (function (err, src) {
    if (err) return cb(err);
    if (options.postcompile) src = options.postcompile(src);
    if (options.debug) {
      if (options.basedir) {
        src = transformSourcesRelativeTo(src, options.basedir);
      }
      src = unixifySourceMap(src);
    }
    if (options.minify) {
      if (options.preminify) src = options.preminify(src);
      try {
        src = minify(src, options.minify).code;
      } catch (ex) { } //better to just let the client fail to parse
      if (options.postminify) src = options.postminify(src);
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
module.exports = cachedCompile
