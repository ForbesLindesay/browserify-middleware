var settings = require('../lib/settings');
var normalize = settings.normalize;
var equal = require('assert').equal;

describe('settings', function () {
  describe('.cache', function () {
    describe('default development', function () {
      it('is `false`', function () {
        settings.mode = 'development';
        equal(normalize().cache, false);
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
})