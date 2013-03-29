var send = require('./send');
var normalize = require('./settings').normalize;

module.exports = directory;
function directory(path, options) {
  options = normalize(options);
  return function (req, res, next) {
    send(path, options, req, res, next);
  };
}