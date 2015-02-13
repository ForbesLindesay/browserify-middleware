var settings = require('../lib/settings');
var normalize = settings.normalize;
var equal = require('assert').strictEqual;
var deepEqual = require('assert').deepEqual;

describe('settings', function () {
  describe('.cache', function () {
    describe('default development', function () {
      it('is `"dynamic"`', function () {
        settings.mode = 'development';
        equal(normalize().cache, 'dynamic');
        settings.mode = 'development';
      });
    });
    describe('default prouction', function () {
      it('is `"public, max-age=60"`', function () {
        settings.mode = 'production';
        equal(normalize().cache, 'public, max-age=60');
        settings.mode = 'development';
      });
    });
    describe('`false`', function () {
      it('remains `false`', function () {
        settings.mode = 'production';
        equal(normalize({cache: false}).cache, false);
        settings.mode = 'development';
        equal(normalize({cache: false}).cache, false);
      });
    });
    describe('`true`', function () {
      it('becomes `"public, max-age=60"`', function () {
        settings.mode = 'production';
        equal(normalize({cache: true}).cache, 'public, max-age=60');
        settings.mode = 'development';
        equal(normalize({cache: true}).cache, 'public, max-age=60');
      });
    });
    describe('`"public, max-age=120"`', function () {
      it('remains `"public, max-age=120"`', function () {
        settings.mode = 'production';
        equal(normalize({cache: 'public, max-age=120'}).cache, 'public, max-age=120');
        settings.mode = 'development';
        equal(normalize({cache: 'public, max-age=120'}).cache, 'public, max-age=120');
      });
    });
    describe('`"10 minutes"`', function () {
      it('becomes `"public, max-age=600"`', function () {
        settings.mode = 'production';
        equal(normalize({cache: '10 minutes'}).cache, 'public, max-age=600');
        settings.mode = 'development';
        equal(normalize({cache: '10 minutes'}).cache, 'public, max-age=600');
      });
    });
    describe('`"10m"`', function () {
      it('becomes `"public, max-age=600"`', function () {
        settings.mode = 'production';
        equal(normalize({cache: '10m'}).cache, 'public, max-age=600');
        settings.mode = 'development';
        equal(normalize({cache: '10m'}).cache, 'public, max-age=600');
      });
    });
    describe('`60000`', function () {
      it('becomes `"public, max-age=60"`', function () {
        settings.mode = 'production';
        equal(normalize({cache: 60000}).cache, 'public, max-age=60');
        settings.mode = 'development';
        equal(normalize({cache: 60000}).cache, 'public, max-age=60');
      });
    });
    describe('`{private: true, maxAge: 600000}`', function () {
      it('becomes `"private, max-age=600"`', function () {
        settings.mode = 'production';
        equal(normalize({cache: {private: true, maxAge: 600000}}).cache, 'private, max-age=600');
        settings.mode = 'development';
        equal(normalize({cache: {private: true, maxAge: 600000}}).cache, 'private, max-age=600');
      });
    });
    describe('`{private: false, maxAge: 600000}`', function () {
      it('becomes `"public, max-age=600"`', function () {
        settings.mode = 'production';
        equal(normalize({cache: {private: false, maxAge: 600000}}).cache, 'public, max-age=600');
        settings.mode = 'development';
        equal(normalize({cache: {private: false, maxAge: 600000}}).cache, 'public, max-age=600');
      });
    });
    describe('`{private: true, maxAge: "10 minutes"}`', function () {
      it('becomes `"private, max-age=600"`', function () {
        settings.mode = 'production';
        equal(normalize({cache: {private: true, maxAge: '10 minutes'}}).cache, 'private, max-age=600');
        settings.mode = 'development';
        equal(normalize({cache: {private: true, maxAge: '10 minutes'}}).cache, 'private, max-age=600');
      });
    });
    describe('`{private: false, maxAge: "10 minutes"}`', function () {
      it('becomes `"public, max-age=600"`', function () {
        settings.mode = 'production';
        equal(normalize({cache: {private: false, maxAge: '10 minutes'}}).cache, 'public, max-age=600');
        settings.mode = 'development';
        equal(normalize({cache: {private: false, maxAge: '10 minutes'}}).cache, 'public, max-age=600');
      });
    });
  })
  describe('.noParse', function () {
    describe('when given `true`', function () {
      it('is `true`', function () {
        equal(normalize({noParse: true}).noParse, true);
      });
    });
    describe('when given `"foo.js"`', function () {
      it('is `["foo.js"]`', function () {
        deepEqual(normalize({noParse: 'foo.js'}).noParse, [
          'foo.js'
        ]);
      });
    });
    describe('when given `["foo.js"]`', function () {
      it('is `["foo.js"]`', function () {
        deepEqual(normalize({noParse: ['foo.js']}).noParse, [
          'foo.js'
        ]);
      });
    });
  });
  describe('using setter', function () {
    describe('settings.env("production")', function () {
      it('returns the production setter', function () {
        equal(settings.env('production'), settings.production);
      });
    });
    describe('settings.production("key", "value")', function () {
      it('sets "key" to "value"', function () {
        equal(settings.production('key', 'value'), settings);
        equal(settings.production.key, 'value');
      });
    });
    describe('settings.production("key")', function () {
      it('sets returns the value of "key"', function () {
        equal(settings.production('key'), 'value');
      });
    });
    describe('settings.production({foo: "bar"})', function () {
      it('sets "foo" to "bar"', function () {
        equal(settings.production({foo: "bar"}), settings);
        equal(settings.production.foo, 'bar');
      });
    });
  });
  describe('with made up modes', function () {
    it('has no defaults', function () {
      settings.mode = 'whatever';
      deepEqual(settings.normalize(), {
        external: [],
        ignore: [],
        ignoreMissing: false,
        transform: [],
        insertGlobals: false,
        detectGlobals: true,
        standalone: false,
        noParse: [],
        extensions: [],
        basedir: undefined,
        grep: /\.js$/,
        cache: false,
        minify: false,
        gzip: true,
        debug: false,
        precompile: false
      });
      settings.mode = 'development';
    });
  });
})
