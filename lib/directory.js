var join = require('path').join;
var fs = require('fs');
var send = require('./send');
var normalize = require('./settings').normalize;

var isJS = /\.js$/;

module.exports = directory;
function directory(path, options) {
  options = normalize(options);
  return function (req, res, next) {
    if (isJS.test(req.path)) {
      fs.stat(join(path, req.path), function (err, stat) {
        if (err || !stat.isFile()) return next();
        send(join(path, req.path), options, req, res, next);
      });
    } else {
      return next();
    }
  };
}