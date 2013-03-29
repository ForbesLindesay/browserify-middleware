var ms = require('ms');

exports = module.exports = setter();

exports.external = [];
exports.ignore = [];
exports.ignoreMissing = false;
exports.transform = [];
exports.insertGlobals = false;
exports.detectGlobals = true;
exports.standalone = false;

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

exports.normalize = normalize;

function setter(obj) {
  obj = obj || set;
  function set(key) {
    if (arguments.length === 2) {
      obj[key] = arguments[1];
      return this;
    } else if (typeof key === 'string') {
      Object.keys(key)
        .forEach(function (k) {
          obj[k] = key[k];
        });
      return this;
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
  Object.keys(exports)
    .forEach(function (key) {
      if (key !== 'production' && key !== 'development' && key !== 'normalize' && (options[key] === null || options[key] === undefined)) {
        options[key] = exports[key];
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

  options.external = arrayify(options.external);
  options.ignore = arrayify(options.ignore);
  options.transform = arrayify(options.transform);

  return options;
}

function arrayify(val) {
  if (val && !Array.isArray(val)) {
    return [val];
  } else {
    return val;
  }
}