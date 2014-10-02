'use strict';

var browserify = require('browserify');
var uglify = require('uglify-js');
var moldSourceMap = require('mold-source-map');
var relative = require('path').relative;
var fs = require('fs');

var DynamicCache = require('./dynamic-cache.js');
//START Compile
var dynamicCache = {};

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
    var cacheName = path + ':' + options.external + ':' + options.debug;
    cache = dynamicCache[cacheName];
    if (cache && !cacheUpdated) {
      return cache.update(function () { compile(path, options, cb, true) });
    } else if (!cache) {
      cache = (dynamicCache[cacheName] = new DynamicCache());
    }
  }

  var bundle = browserify({
    noParse: options.noParse,
    extensions: options.extensions,
    resolve: options.resolve,
    insertGlobals: options.insertGlobals,
    detectGlobals: options.detectGlobals,
    ignoreMissing: options.ignoreMissing,
    debug: options.debug,
    standalone: options.standalone || false,
    cache: cache ? cache.getCache() : undefined
  });
  if (Array.isArray(path)) {
    for (var i = 0; i < path.length; i++) {
      if (typeof path[i] === 'object') { // obj spec support; i.e. {"jquery": {options...}}
        var spec = path[i];
        var keys = Object.keys(spec);
        keys.forEach(function (key) {
          console.dir(key);
          console.dir(spec[key]);
          bundle.require(key, spec[key]);
        })
      } else {
        bundle.require(path[i]);
      }
    }
  } else {
    bundle.add(path);
  }
  if (cache) {
    cache.populate(bundle);
  }
  for (var i = 0; i < (options.external || []).length; i++) {
    bundle.external(options.external[i]);
  }
  for (var i = 0; i < (options.ignore || []).length; i++) {
    bundle.ignore(options.ignore[i]);
  }
  for (var i = 0; i < (options.transform || []).length; i++) {
    var transform = options.transform[i];

    if (Array.isArray(transform)) {
      bundle.transform(transform[1], transform[0]);
    } else {
      bundle.transform(transform);
    }
  }
  bundle.bundle(function (err, src) {
    if (err) return cb(err);
    src = src.toString();
    if (options.postcompile) src = options.postcompile(src);
    /*
    if (options.debug) {
      if (options.basedir) {
        src = transformSourcesRelativeTo(src, options.basedir);
      }
      src = unixifySourceMap(src);
    }
    */
    if (options.minify) {
      if (options.preminify) src = options.preminify(src);
      try {
        src = minify(src, options.minify).code;
      } catch (ex) { } //better to just let the client fail to parse
      if (options.postminify) src = options.postminify(src);
    }
    cb(null, src);
  });
}

module.exports = compile
