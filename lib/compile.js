'use strict';

var browserify = require('browserify');
var uglify = require('uglify-js');
var moldSourceMap = require('mold-source-map');
var relative = require('path').relative;
var fs = require('fs');
var guard = require('once');

var DynamicCache = require('./dynamic-cache.js');
//START Compile
var dynamicCache = {};

function minify(str, options) {
  if (!options || typeof options !== 'object') options = {};
  options.fromString = true;
  return uglify.minify(str, options);
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
    basedir: options.basedir,
    debug: options.debug,
    standalone: options.standalone || false,
    cache: cache ? cache.getCache() : undefined,
    fullPaths: cache ? true : false
  });
  if (options.plugins) {
    var plugins = options.plugins; // in the format options.plugins = [{plugin: plugin, options: options}, {plugin: plugin, options: options}, ... ]
    for(var i = 0; i < plugins.length; i++) {
      var obj = plugins[i];
      bundle.plugin(obj.plugin, obj.options);
    }
  }
  if (Array.isArray(path)) {
    for (var i = 0; i < path.length; i++) {
      if (typeof path[i] === 'object') { // obj spec support; i.e. {"jquery": {options...}}
        var spec = path[i];
        var keys = Object.keys(spec);
        keys.forEach(function (key) {
          if (spec[key].run) {
            bundle.add(key, spec[key]);
          } else {
            bundle.require(key, spec[key]);
          }
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
