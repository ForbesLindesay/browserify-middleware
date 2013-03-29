var send = require('./send');
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
  return function (req, res, next) {
    send(modules, options, req, res, next);
  };
}