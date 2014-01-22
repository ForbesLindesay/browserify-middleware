'use strict';

var fs = require('fs');

module.exports = DynamicCache;

function DynamicCache() {
  this._queue = [];
  this._cache = {};
  this._time = {};
}

DynamicCache.prototype.update = function (cb) {
  var cached = Object.keys(this._time);
  var remaining = cached.length;
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
  cached.forEach(function (file) {
    if (!(file in this._cache)) return endOne();
    fs.stat(file, function (err, stats) {
      if (err || stats.mtime.getTime() !== this._time[file]) {
        if (file in this._cache) {
          delete this._cache[file];
        }
        if (file in this._time) {
          delete this._time[file];
        }
      }
      endOne();
    }.bind(this))
  }.bind(this));
};

DynamicCache.prototype.add = function (dep) {
  fs.stat(dep.id, function (err, stats) {
    if (err) return;
    this._cache[dep.id] = dep
    this._time[dep.id] = stats.mtime.getTime()
  }.bind(this))
};

DynamicCache.prototype.getCache = function () {
  return this._cache;
};
