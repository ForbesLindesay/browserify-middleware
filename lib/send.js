var cachedCompile = require('./compile');
var start = new Date().toUTCString();

module.exports = function send(path, options, req, res, next) {
  cachedCompile(path, options, function (err, src, gzipped, tag) {
    if (err) return next(err);

    try {
      // vary
      if (!res.getHeader('Vary')) {
        res.setHeader('Vary', 'Accept-Encoding');
      } else if (!~res.getHeader('Vary').indexOf('Accept-Encoding')) {
        res.setHeader('Vary', res.getHeader('Vary') + ', Accept-Encoding');
      }

      res.setHeader('content-type', 'text/javascript');

      //check old etag
      if (req.headers['if-none-match'] === tag) {
        res.statusCode = 304;
        res.end();
        return;
      }

      //add new etag
      res.setHeader('ETag', tag);
      res.setHeader('Last-Modified', start);

      //add cache-control
      if (options.cache && options.cache !== 'dynamic') {
        res.setHeader('Cache-Control', options.cache);
      }

      //add gzip
      if (options.gzip && supportsGzip(req)) {
        res.setHeader('Content-Encoding', 'gzip');
        src = gzipped;
      }

      //set content-length (src must always be a buffer)
      res.setHeader('Content-Length', src.length);

      //send content
      if ('HEAD' === req.method) res.end();
      else res.end(src);
    } catch (ex) {
      if (!res.headerSent) {
        try { return next(ex); } catch (ex) {}
      }
      console.error(ex.stack || ex.message || e);
    }
  });
}

function supportsGzip(req) {
  return req.headers
      && req.headers['accept-encoding']
      && req.headers['accept-encoding'].indexOf('gzip') !== -1;
}
