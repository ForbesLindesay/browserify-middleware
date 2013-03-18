var send = require('./send');
var normalize = require('./normalize');

module.exports = modules;
function modules(modules, options) {
  options = normalize(options);
  return function (req, res, next) {
    send(modules, options, req, res, next);
  };
}