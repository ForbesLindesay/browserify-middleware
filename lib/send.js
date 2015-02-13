'use strict';

var prepare = require('prepare-response');
var compile = require('./compile');
var start = new Date().toUTCString();

var cache = {};
module.exports = function send(path, options, req, res, next) {
  var cacheKey = JSON.stringify(path);
  if (options.cache && options.cache !== 'dynamic' && cache[cacheKey]) {
    return cache[cacheKey].send(req, res);
  }
  compile(path, options, function (err, src) {
    if (err) return next(err);
    var headers = {'content-type': 'application/javascript'};
    if (options.cache && options.cache !== 'dynamic') {
      headers['cache-control'] = options.cache;
    }
    prepare(src, headers, {
      gzip: options.gzip
    }).nodeify(function (err, response) {
      /* istanbul ignore if */
      if (err) return next(err);
      if (options.cache && options.cache !== 'dynamic') {
        cache[cacheKey] = response;
      }
      response.send(req, res);
    });
  });
}
