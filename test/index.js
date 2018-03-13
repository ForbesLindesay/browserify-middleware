var hyperquest = require('hyperquest');
var concat = require('concat-stream');
var assert = require('assert');
var vm = require('vm');
var http = require('http');
var browserify = require('../');

var REPEAT_COUNT = 2;
if (process.env.npm_lifecycle_event === 'test:perf' ||
    process.env.npm_lifecycle_event === 'test' && process.env.CI) {
  REPEAT_COUNT = 50;

  console.warn('  Each file is downloaded ~' + REPEAT_COUNT + ' times in parallel to get some feel for how');
  console.warn('  performance scales.');
  console.warn();
  console.warn('  When comparing gzip and not gzip, don\'t forget to account for increased');
  console.warn('  time unzipping on the client.');
} else {
  console.warn('  To test the performance, run `npm run test:perf`');
  console.warn('  which will download each file 50 times in prallel');
}


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

app.use('/file/jqparse.js', browserify(__dirname + '/directory/jquery.min.js', {cache: false, gzip: false, minify: false, debug: false}))
app.use('/file/jqnoparse.js', browserify(__dirname + '/directory/jquery.min.js', {cache: false, gzip: false, minify: false, debug: false, noParse: [__dirname + '/directory/jquery.min.js']}))

app.use('/file/beep.js', browserify(__dirname + '/directory/beep.js', {
  cache: 'dynamic',
  gzip: false,
  minify: false,
  debug: true
}));
app.use('/opt/file/beep.js', browserify(__dirname + '/directory/beep.js', {
  cache: true,
  precompile: true,
  gzip: true,
  minify: true,
  debug: false
}));
app.use('/file/boop.js', browserify(__dirname + '/directory/boop.js', {
  cache: 'dynamic',
  gzip: false,
  minify: false,
  debug: true
}));
app.use('/opt/file/boop.js', browserify(__dirname + '/directory/boop.js', {
  cache: true,
  gzip: true,
  minify: true,
  debug: false
}));
app.use('/syntax-error.js', browserify(__dirname + '/directory/syntax-error.js', {
  cache: 'dynamic',
  gzip: false,
  minify: false,
  debug: true
}));
app.use('/opt/syntax-error.js', browserify(__dirname + '/directory/syntax-error.js', {
  cache: true,
  gzip: true,
  minify: true,
  debug: false
}));
app.use('/weirddep.js', browserify(__dirname + '/directory/weirddep.js', {
  extensions: ['.weird']
}));
app.use('/opt/weirddep.js', browserify(__dirname + '/directory/weirddep.js', {
  extensions: ['.weird'],
  gzip: true
}));

app.use('/dir', browserify(__dirname + '/directory', {
  cache: 'dynamic',
  gzip: false,
  minify: false,
  debug: true
}));
app.use('/opt/dir', browserify(__dirname + '/directory', {
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
  precompile: true,
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


app.get('/no-mangle.js', browserify(__dirname + '/directory/no-mangle.js', {
  cache: false,
  gzip: false,
  minify: {
    compress: true,
    mangle: false
  },
  debug: true
}));
app.get('/opt/no-mangle.js', browserify(__dirname + '/directory/no-mangle.js', {
  cache: true,
  gzip: true,
  minify: {
    compress: true,
    mangle: false
  },
  debug: false
}));

app.get('/fullpaths.js', browserify(__dirname + '/directory/beep.js', {
  cache: false,
  gzip: false,
  minify: {
    mangle: false
  },
  debug: true,
  fullPaths: true
}));
app.get('/opt/fullpaths.js', browserify(__dirname + '/directory/beep.js', {
  cache: true,
  gzip: true,
  minify: {
    mangle: false
  },
  debug: false,
  fullPaths: true
}));

app.get('/opt/no-bundle-external.js', browserify(__dirname + '/directory/no-bundle-external.js', {
  bundleExternal: false,
  debug: false,
}));

var port;
var server;
(function () {
  var listeners = [];
  port = function (fn) {
    listeners.push(fn);
  };
  server = http.createServer(function (req, res) {
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
    var res;
    hyperquest('http://localhost:' + port + (optimised ? '/opt' : '') + path, function (err, _res) {
      if (err) {
        erred = true;
        return cb(err);
      }
      res = _res;
    })
    .pipe(concat(function (body) {
      if (erred) return;
      if (res.statusCode >= 400) {
        var err = new Error('Server responded with status code ' + res.statusCode + ':\n\n' + body.toString());
        err.statusCode = res.statusCode;
        return cb(err);
      }
      return cb(null, body.toString());
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
          var pending = REPEAT_COUNT;
          for (var i = 0; i < REPEAT_COUNT; i++) {
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
  it.skip = oldIt.skip.bind(oldIt);
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
    // see: https://github.com/substack/node-browserify/pull/907
    it.skip('makes require available (using module options object)', function (done) {
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
      get('/no-mangle.js', optimised, function (err, res) {
        if (err) return done(err);
        const searchString = "foo+bar";
        try {
          assert(res.indexOf(searchString) !== -1);
        } catch (ex) {
          throw new Error('Expected ' + JSON.stringify(res) + ' to contain ' + JSON.stringify(searchString));
        }
        vm.runInNewContext(res, {
          Math: {
            random: () => 0.99,
          },
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
  describe('passes other options to browserify', function () {
    it('passes fullPaths', function (done) {
      get('/fullpaths.js', optimised, function (err, res) {
        if (err) return done(err);
        assert(res.indexOf('test/directory/beep.js') != -1);

        vm.runInNewContext(res, {
          console: {
            log: function (res) {
              assert.equal(res, 'BEEP!');
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
  it('speeds things up by at least a factor of 4 (for jQuery)', function (done) {
    this.slow(1000)
    this.timeout(20000)
    var start = new Date();
    get('/file/jqparse.js', false, function (err, res) {
      if (err) return done(err);
      var middle = new Date();
      get('/file/jqnoparse.js', false, function (err, res) {
        if (err) return done(err);
        var end = new Date();
        assert((middle - start) > (end - middle) * 4, 'Without noParse was ' + (middle - start) + ' with noParse was ' + (end - middle));
        done();
      });
    });
  });
});

describe('options.bundleExternal= false', function () {
  it('Exclude node_modules and builtins', function (done) {
    this.slow(1000)
    this.timeout(20000)
    var start = new Date();
    get('/opt/no-bundle-external.js', false, function (err, res) {
      if (err) return done(err);
      assert.equal(res.match(/Copyright Joyent, Inc/), null);
      done();
    });
  });
});
