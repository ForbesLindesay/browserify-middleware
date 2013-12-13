var hyperquest = require('hyperquest');
var concat = require('concat-stream');
var assert = require('assert');
var vm = require('vm');
var http = require('http');
var browserify = require('../');

console.warn('  Each file is downloaded ~50 times in parallel to get some feel for how');
console.warn('  performance scales.');
console.warn();
console.warn('  When comparing gzip and not gzip, don\'t forget to account for increased');
console.warn('  time unzipping on the client.');

var app = {middleware: []}
app.use = function (path, handler) {
  app.middleware.push(function (url, req, res, next) {
    if (url.pathname.indexOf(path) !== 0) return next()
    else {
      req.path = url.pathname.replace(path, '')
      handler(req, res, next)
    }
  })
}
app.get = function (path, handler) {
  app.middleware.push(function (url, req, res, next) {
    if (url.pathname !== path) return next()
    else handler(req, res, next)
  })
}

app.use('/file/jqparse.js', browserify('./directory/jquery.min.js', {cache: false, gzip: false, minify: false, debug: false}))
app.use('/file/jqnoparse.js', browserify('./directory/jquery.min.js', {cache: false, gzip: false, minify: false, debug: false, noParse: ['./directory/jquery.min.js']}))

app.use('/file/beep.js', browserify('./directory/beep.js', {
  cache: 'dynamic',
  gzip: false,
  minify: false,
  debug: true
}));
app.use('/opt/file/beep.js', browserify('./directory/beep.js', {
  cache: true,
  gzip: true,
  minify: true,
  debug: false
}));
app.use('/file/boop.js', browserify('./directory/boop.js', {
  cache: 'dynamic',
  gzip: false,
  minify: false,
  debug: true
}));
app.use('/opt/file/boop.js', browserify('./directory/boop.js', {
  cache: true,
  gzip: true,
  minify: true,
  debug: false
}));
app.use('/syntax-error.js', browserify('./directory/syntax-error.js', {
  cache: 'dynamic',
  gzip: false,
  minify: false,
  debug: true
}));
app.use('/opt/syntax-error.js', browserify('./directory/syntax-error.js', {
  cache: true,
  gzip: true,
  minify: true,
  debug: false
}));
app.use('/weirddep.js', browserify('./directory/weirddep.js', {
  extensions: ['.weird']
}));
app.use('/opt/weirddep.js', browserify('./directory/weirddep.js', {
  extensions: ['.weird'],
  gzip: true
}));

app.use('/dir', browserify('./directory', {
  cache: 'dynamic',
  gzip: false,
  minify: false,
  debug: true
}));
app.use('/opt/dir', browserify('./directory', {
  cache: true,
  gzip: true,
  minify: true,
  debug: false
}));

app.use('/mod.js', browserify(['require-test'], {
  cache: 'dynamic',
  gzip: false,
  minify: false,
  debug: true,
  external: ['require-test']
}));
app.use('/opt/mod.js', browserify(['require-test'], {
  cache: true,
  gzip: true,
  minify: true,
  debug: false,
  external: ['require-test']
}));
app.use('/modObj.js', browserify([{'require-test': {expose: 'require-test-exposed'}}], {
  cache: false,
  gzip: false,
  minify: false,
  debug: true
}));
app.use('/opt/modObj.js', browserify([{'require-test': {expose: 'require-test-exposed'}}], {
  cache: true,
  gzip: true,
  minify: true,
  debug: false
}));

app.get('/dir/file.txt', function (req, res) {
  res.end('foo');
});
app.get('/opt/dir/file.txt', function (req, res) {
  res.end('foo');
});
app.get('/dir/non-existant.js', function (req, res) {
  res.end('bar');
});
app.get('/opt/dir/non-existant.js', function (req, res) {
  res.end('bar');
});


app.get('/no-minify.js', browserify('./directory/no-minify.js', {
  cache: false,
  gzip: false,
  minify: {
    mangle: false
  },
  debug: true
}));
app.get('/opt/no-minify.js', browserify('./directory/no-minify.js', {
  cache: true,
  gzip: true,
  minify: {
    mangle: false
  },
  debug: false
}));

var port;
(function () {
  var listeners = [];
  port = function (fn) {
    listeners.push(fn);
  };
  http.createServer(function (req, res) {
    var url = require('url').parse(req.url)
    var i = 0
    function next(err) {
      if (err) return res.statusCode = 500, res.end(err.stack || err.message || err);
      if (i === app.middleware.length) {
        console.dir(url)
        return res.statusCode = 404, res.end('404 file not found');
      }
      app.middleware[i++](url, req, res, next)
    }
    next()
  })
  .listen(0, function () {
    var pt = this.address().port;
    while (listeners.length) {
      listeners.shift()(pt);
    }
    port = function (fn) {
      fn(pt);
    }
  });
}());

function get(path, optimised, cb) {
  port(function (port) {
    var erred = false;
    hyperquest('http://localhost:' + port + (optimised ? '/opt' : '') + path, function (err, res) {
      erred = err || res.statusCode >= 400;
      if (err) return cb(err);
      if (res.statusCode >= 400) {
        var err = new Error('Server responded with status code ' + res.statusCode);
        err.statusCode = res.statusCode;
        return cb(err);
      }
    })
    .pipe(concat(function (res) {
      if (erred) return;
      return cb(null, res.toString());
    }));
  })
}
function getZip(path, optimised, cb) {
  if (/non-existant/.test(path) || /file\.txt/.test(path)) {
    return get(path, optimised, cb);
  }
  port(function (port) {
    hyperquest('http://localhost:' + port + (optimised ? '/opt' : '') + path, {headers: {'Accept-Encoding':'gzip'}},
      function (err, res) {
        if (err) return cb(err);
        if (res.statusCode >= 400) {
          var err = new Error('Server responded with status code ' + res.statusCode);
          err.statusCode = res.statusCode;
          return cb(err);
        }
        this.pipe(require('zlib').createGunzip())
            .pipe(concat(function (res) {
              return cb(null, res.toString());
            }));
      })
  })
}


function test(optimised, get, it) {
  var oldIt = it;
  it = function (name, fn) {
    return oldIt(name, function (done) {
      this.slow(100);
      fn(function (err) {
        if (err) return done(err);
        if (/syntax error/.test(name)) return done();
        fn(function (err) {
          if (err) return done(err);
          var pending = 50;
          for (var i = 0; i < 50; i++) {
            fn(then);
          };
          var called = false;
          function then(err) {
            if (err && !called) {
              called = true;
              return done(err);
            }
            if (--pending === 0 && !called) return done();
          }
        })
      })
    });
  };
  describe('file', function () {
    it('browserifies beep', function (done) {
      get('/file/beep.js', optimised, function (err, res) {
        if (err) return done(err);
        vm.runInNewContext(res, {
          console: {
            log: function (txt) {
              assert.equal(txt, 'BEEP!');
              done();
            }
          }
        })
      });
    });
    it('browserifies boop', function (done) {
      get('/file/boop.js', optimised, function (err, res) {
        if (err) return done(err);
        vm.runInNewContext(res, {
          console: {
            log: function (txt) {
              assert.equal(txt, 'BOOP!');
              done();
            }
          }
        })
      });
    });
    it('returns error code 500 if there is a syntax error', function (done) {
      get('/syntax-error.js', optimised, function (err, res) {
        assert.equal(err.statusCode, 500);
        done();
      });
    })
  });
  describe('directory', function () {
    it('browserifies beep', function (done) {
      get('/dir/beep.js', optimised, function (err, res) {
        if (err) return done(err);
        vm.runInNewContext(res, {
          console: {
            log: function (txt) {
              assert.equal(txt, 'BEEP!');
              done();
            }
          }
        })
      });
    });
    it('browserifies boop', function (done) {
      get('/dir/boop.js', optimised, function (err, res) {
        if (err) return done(err);
        vm.runInNewContext(res, {
          console: {
            log: function (txt) {
              assert.equal(txt, 'BOOP!');
              done();
            }
          }
        })
      });
    });
    it('falls through if the file is not a JavaScript file', function (done) {
      get('/dir/file.txt', optimised, function (err, res) {
        if (err) return done(err);
        assert.equal(res, 'foo');
        done();
      });
    });
    it('falls through if the file does not exist', function (done) {
      get('/dir/non-existant.js', optimised, function (err, res) {
        if (err) return done(err);
        assert.equal(res, 'bar');
        done();
      });
    });
    it('makes require available (using module options object)', function (done) {
      get('/modObj.js', optimised, function (err, res) {
        if (err) return done(err);
        vm.runInNewContext(res, {
          console: {
            log: function () {
              throw new Error('Module should wait to be required');
            }
          }
        });
        vm.runInNewContext(res + '\nrequire("require-test-exposed");', {
          console: {
            log: function (res) {
              assert.equal(res, 'required');
              done();
            }
          }
        });
      });
    });
  });
  describe('package', function () {
    it('makes require available', function (done) {
      get('/mod.js', optimised, function (err, res) {
        if (err) return done(err);
        vm.runInNewContext(res, {
          console: {
            log: function () {
              throw new Error('Module should wait to be required');
            }
          }
        });
        vm.runInNewContext(res + '\nrequire("require-test");', {
          console: {
            log: function (res) {
              assert.equal(res, 'required');
              done();
            }
          }
        });
      });
    });
  });
  describe('extensions', function () {
    it('includes files required with weird extensions', function (done) {
      get('/weirddep.js', optimised, function (err, res) {
        if (err) return done(err);
        vm.runInNewContext(res, {
          console: {
            log: function (txt) {
              assert.equal(txt, 'this is a weird file to require');
              done();
            }
          }
        })
      });
    });
  });
  describe('minify: options', function () {
    it('passes options to uglifyjs', function (done) {
      get('/no-minify.js', optimised, function (err, res) {
        if (err) return done(err);
        assert(/add\(foo,bar\){return foo\+bar}console\.log\(add\(1,2\)\)/.test(res));
        vm.runInNewContext(res, {
          console: {
            log: function (res) {
              assert.equal(res, 3);
              done();
            }
          }
        })
      });
    });
  });
}

describe('In NODE_ENV=development (default)', function () {
  test(false, get, it);
});

describe('In NODE_ENV=production', function () {
  describe('without gzip', function () {
    test(true, getZip, it);
  });
  describe('with gzip', function () {
    test(true, get, it);
  });
});

describe('options.noParse', function () {
  it('speeds things up by at least a factor of 5 (for jQuery)', function (done) {
    this.slow(1000)
    this.timeout(10000)
    var start = new Date();
    get('/file/jqparse.js', false, function (err, res) {
      if (err) return done(err);
      var middle = new Date();
      get('/file/jqnoparse.js', false, function (err, res) {
        if (err) return done(err);
        var end = new Date();
        assert((middle - start) > (end - middle) * 5, 'Without noParse was ' + (middle - start) + ' with noParse was ' + (end - middle));
        done();
      });
    });
  });
});