var send = require('./send');
var cachedCompile = require('./compile');
var normalize = require('./settings').normalize;

module.exports = modules;
function modules(modules, options) {
  options = normalize(options);
  if (options.external) {
    options.external = options.external
      .filter(function (name) {
        return modules.indexOf(name) === -1;
      });
  }
  if (options.precompile) {
    cachedCompile(modules, options, function () {});
  }
  return function (req, res, next) {
    send(modules, options, req, res, next);
  };
}