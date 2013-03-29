var ms = require('ms');

exports = module.exports = normalize;

exports.mode = process.env.NODE_ENV || 'development';

exports.production = setter();
exports.production.cache = true;
exports.production.minify = true;
exports.production.gzip = true;
exports.production.debug = false;

exports.development = setter();
exports.development.cache = false;
exports.development.minify = false;
exports.development.gzip = false;
exports.development.debug = true;

exports.setter = setter;
function setter(obj) {
  obj = obj || set;
  function set(key) {
    if (arguments.length === 2) {
      obj[key] = arguments[1];
    } else if (typeof key === 'string') {
      Object.keys(key)
        .forEach(function (k) {
          obj[k] = key[k];
        });
    } else {
      return obj[key];
    }
  }
  return set;
}

function normalize(options) {
  var defaults = exports[exports.mode];
  options = options || {};

  Object.keys(defaults)
    .forEach(function (key) {
      if (options[key] === null || options[key] === undefined) {
        options[key] = defaults[key];
      }
    });


  if (typeof options.cache === 'string' && ms(options.cache)) {
    options.cache = 'public, max-age=' + Math.floor(ms(options.cache)/1000);
  } else if (options.cache === true) {
    options.cache = 'public, max-age=60';
  } else if (typeof options.cache === 'number') {
    options.cache = 'public, max-age=' + Math.floor(options.cache/1000);
  } else if (typeof options.cache === 'object') {
    options.cache = (options.cache.private ? 'private' : 'public') + ', max-age='
                  + Math.floor(ms(options.cache.maxAge.toString())/1000);
  }

  return options;
}