
module.exports = normalize;
function normalize(options) {
  options = options || {};
  if (typeof options.cache !== 'boolean')
    options.cache = process.env.NODE_ENV === 'production';
  if (typeof options.debug !== 'boolean')
    options.debug = process.env.NODE_ENV !== 'production';
  return options;
}