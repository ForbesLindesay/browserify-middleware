'use strict';

var browserify = require('browserify');

function compile(path, options) {
  var bundle = browserify({
    noParse: options.noParse,
    extensions: options.extensions,
    resolve: options.resolve,
    insertGlobals: options.insertGlobals,
    detectGlobals: options.detectGlobals,
    ignoreMissing: options.ignoreMissing,
    bundleExternal: options.bundleExternal,
    basedir: options.basedir,
    debug: options.debug,
    standalone: options.standalone || false,
    cache: options.cache === 'dynamic' ? {} : undefined,
    packageCache: options.cache === 'dynamic' ? {} : undefined
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
  return bundle;
}

module.exports = compile
