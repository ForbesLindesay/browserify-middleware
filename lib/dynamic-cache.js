'use strict';

var fs = require('fs');

function objectValues(obj) {
  if (typeof obj !== 'object') {
    return [];
  }

  return Object.keys(obj).map(function (key) {
    return obj[key];
  });
}

module.exports = DynamicCache;

function DynamicCache() {
  this._queue = [];
  this._cache = {};
  this._files = {};
  this._time = {};
}

DynamicCache.prototype.update = function (cb) {
  var files = Object.keys(this._time);
  var remaining = files.length;
  if (remaining === 0) return cb();
  if (this._queue.length) return this._queue.push(cb);
  this._queue.push(cb);
  var endOne = function () {
    if (0 === --remaining) {
      for (var i = 0; i < this._queue.length; i++) {
        this._queue[i]();
      }
      this._queue = [];
    }
  }.bind(this);
  var getDeps = function (filename) {
    if (this._files[filename]) {
      return [[filename]].concat(this._files[filename].map(getDeps)).reduce(function (a, b) {
        return a.concat(b);
      });
    } else {
      return [filename];
    }
  }.bind(this);
  files.forEach(function (filename) {
    fs.stat(filename, function (err, stats) {
      if (err || stats.mtime.getTime() !== this._time[filename]) {
        var deps = getDeps(filename);
        for (var i = 0; i < deps.length; i++) {
          var dep = deps[i];
          if (this._cache[dep]) {
            delete this._cache[dep];
          }
        }
        if (filename in this._files) {
          delete this._files[filename];
        }
        if (filename in this._time) {
          delete this._time[filename];
        }
      }
      endOne();
    }.bind(this))
  }.bind(this));
};

DynamicCache.prototype.populate = function (bundle) {
  this._files = {};
  this._time = {};

  bundle.on('dep', function (dep) {
    fs.stat(dep.file, function (err, stats) {
      if (err) return;
      this._cache[dep.id] = dep;
      this._files[dep.file] = objectValues(dep.deps);
      this._time[dep.file] = stats.mtime.getTime();
    }.bind(this));
  }.bind(this));

  bundle.on('transform', function (tr, file) {
    tr.on('file', function (dependency) {
      fs.stat(dependency, function (err, stats) {
        if (err) return;
        this._files[dependency] = objectValues(dependency.deps);
        this._time[dependency] = stats.mtime.getTime();
      }.bind(this));
    }.bind(this));
  }.bind(this));
};

DynamicCache.prototype.getCache = function () {
  return this._cache;
};
