var send = require('./send');
var cachedCompile = require('./compile');
var normalize = require('./settings').normalize;

module.exports = directory;
function directory(path, options) {
  options = normalize(options);
  if (options.precompile) {
    cachedCompile(path, options, function () {});
  }
  return function (req, res, next) {
    send(path, options, req, res, next);
  };
}