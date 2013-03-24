
module.exports = normalize;
function normalize(options) {
  var production = process.env.NODE_ENV === 'production';
  options = options || {};
  if (typeof options.cache !== 'boolean')
    options.cache = production;
  if (typeof options.minify !== 'boolean')
    options.minify = production && options.cache === true;
  if (typeof options.gzip !== 'boolean')
    options.gzip = production && options.cache === true;
  if (typeof options.debug !== 'boolean')
    options.debug = production === false && options.minify === false;
  return options;
}