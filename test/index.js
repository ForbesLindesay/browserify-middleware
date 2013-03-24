var hyperquest = require('hyperquest');
var concat = require('concat-stream');
var assert = require('assert');
var vm = require('vm');
var browserify = require('../');
var express = require('express');
var app = express();

app.use('/file/beep.js', browserify('./directory/beep.js', {
  cache: false,
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
  cache: false,
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

app.use('/dir', browserify('./directory', {
  cache: false,
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
  cache: false,
  gzip: false,
  minify: false,
  debug: true
}));
app.use('/opt/mod.js', browserify(['require-test'], {
  cache: true,
  gzip: true,
  minify: true,
  debug: false
}));

app.get('/dir/file.txt', function (req, res) {
  res.send('foo');
});
app.get('/opt/dir/file.txt', function (req, res) {
  res.send('foo');
});
app.get('/dir/non-existant.js', function (req, res) {
  res.send('bar');
});
app.get('/opt/dir/non-existant.js', function (req, res) {
  res.send('bar');
});

var port;
(function () {
  var listeners = [];
  port = function (fn) {
    listeners.push(fn);
  };
  app.listen(0, function () {
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
        return cb(new Error('Server responded with status code ' + res.statusCode));
      }
    })
    .pipe(concat(function (err, res) {
      if (erred) return;
      if (err) return cb(err);
      return cb(null, res.toString());
    }));
  })
}


function test(optimised) {
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
  });
  describe('package', function () {
    it('makes require available', function (done) {
      get('/mod.js', optimised, function (err, res) {
        if (err) return done(err);
        //assert.equal(res, '');
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
}

describe('In NODE_ENV=development (default)', function () {
  test(false);
});

describe('In NODE_ENV=production', function () {
  test(true);
});