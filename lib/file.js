var send = require('./send');
var normalize = require('./settings').normalize;
var precompiler = require("./precompiler");

module.exports = file;
function file(path, options) {
  options = normalize(options);
  if (options.cache && options.precompile) {
    precompiler(options)(path);
  }

  return function (req, res, next) {
    send(path, options, req, res, next);
  };
}