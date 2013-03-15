var join = require('path').join;
var fs = require('fs');
var send = require('./send');
var normalize = require('./normalize');

module.exports = directory;
function directory(path, options) {
  options = normalize(options);
  return function (req, res, next) {
    fs.stat(join(path, req.path), function (err, stat) {
      if (err || !stat.isFile()) return next();
      send(join(path, req.path), options, res, next);
    });
  };
}