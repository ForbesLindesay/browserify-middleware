var send = require('./send');
var normalize = require('./settings').normalize;

var precompiler = require("./precompiler");

module.exports = modules;
function modules(modules, options) {
  options = normalize(options);
  if (options.cache && options.precompile) {
    precompiler(options)(modules);
  }
  if (options.external) {
    options.external = options.external
      .filter(function (name) {
        return modules.indexOf(name) === -1;
      });
  }
  return function (req, res, next) {
    send(modules, options, req, res, next);
  };
}