2.2.0 / 2013-12-16
==================

  * Update browserify to 3.4.0
  * Pass minify options to uglify-js (suggested by [@rnikitin](https://github.com/rnikitin))
  * Pass `resolve` and `basedir` options to browserify

2.1.0 / 2013-12-13
==================

  * Update browserify to 3.2.1

2.0.0 / 2013-12-09
==================

  * Update browserify to 3.0.0 (brings major reductions in file sizes for many browserified modules, deprecates support for some features in older browsers)
  * Suport per-module options to allow custom expose names (thanks to [@KylePDavis](https://github.com/KylePDavis))

1.21.0 / 2013-11-30
===================

  * Update browserify to 2.36.0

1.20.0 / 2013-11-22
===================

  * Update browserify to 2.35.0
  * Update mold-source-map to 0.3.0
  * Refactor (thanks to [duereg](https://github.com/duereg))

1.19.0 / 2013-09-30
===================

  * Update browserify to 2.33.0
  * Support options.extensions (thanks to [@refractalize](https://github.com/refractalize))

1.18.0 / 2013-09-23
===================

  * Update browserify to 2.32.2

1.17.2 / 2013-08-25
===================

  * Update browserify to 2.29.0

1.17.1 / 2013-08-25
===================

  * Update browserify to 2.28.0
  * Update uglify-js to 2.4.0

1.17.0 / 2013-08-05
===================

  * Update browserify to 2.26.0
  * You can serve non-js files via the `grep` option (thanks to [@maxnordlund](https://github.com/maxnordlund))
  * Fix double compile with dynamic caching (thanks to [@ef4](https://github.com/ef4))
  * Fix noParse for bare module names (thanks to [@ef4](https://github.com/ef4))

1.16.0 / 2013-07-25
===================

  * Update browserify to 2.25.1

1.15.0 / 2013-07-25
===================

  * Give source-maps the correct path separators on windows (which leads to a proper folder browser in devtools)
  * Add a `basedir` option to display source map paths relative to

1.14.1 / 2013-07-09
===================

  * Update browserify to 2.24.2

1.14.0 / 2013-07-07
===================

  * Implement dynamic caching (`{cache: 'dynamic'}` is now the default when in development mode)
  * Update browserify to 2.23.1

1.13.1 / 2013-07-03
===================

  * Add support for using without express (except serving a directory)
  * Fix `opts.noParse` (thanks to [@haimschindler](https://github.com/haimschindler))

1.13.0 / 2013-06-26
===================

  * Update browserify to 2.22.0

1.12.0 / 2013-05-31
===================

  * Update browserify to 2.17.2

1.11.0 / 2013-05-30
===================

  * Update browserify to 2.16.0
  * Add npm badge

1.10.0 / 2013-05-21
===================

  * Update browserify to 2.14.1
  * Added `noParse` option

1.9.0 / 2013-05-02
==================

  * Update uglify-js to 2.3.0
  * Added `.npmignore`

1.8.3 / 2013-04-30
==================

  * Fix reservedKeys logic for settings (thanks to [@mhart](https://github.com/mhart))

1.8.2 / 2013-04-30
==================

  * Fix key check for setter when given an object (thanks to [@mhart](https://github.com/mhart))

1.8.1 / 2013-04-22
==================

  * Remove patch for [substack/syntax-error#1](https://github.com/substack/node-syntax-error/pull/1)

1.8.0 / 2013-04-22
==================

  * Update browserify to 2.13.2
  * remove work arround for [substack/browserify#375](https://github.com/substack/node-browserify/pull/375)
  * add patch for [substack/syntax-error#1](https://github.com/substack/node-syntax-error/pull/1)

1.7.1 / 2013-04-16
==================

  * add work arround for [substack/browserify#375](https://github.com/substack/node-browserify/pull/375)
  * Return `env` if it already exists (thanks to [@mhart](https://github.com/mhart))

1.7.0 / 2013-04-15
==================

  * Support custom environments

1.6.0 / 2013-04-08
==================

  * update browserify to 2.12.0

1.5.0 / 2013-04-01
==================

  * update browserify to 2.11.0

1.4.1 / 2013-03-30
==================

  * update browserify to 2.10.2
  * Fix `vary` not defined (thanks to [@vicapow](https://github.com/vicapow))

1.4.0 / 2013-03-29
==================

  * Add support for modifying Cache-Conrol
  * Overhall settings (see readme for new settings API)

1.3.0 / 2013-03-29
==================

  * Update browserify to 2.10.1

1.2.0 / 2013-03-27
==================

  * update browserify to 2.9.0
  * Add vary header so proxy caches don't serve gzipped to clients that can't handle it
  * Added Content-Length header (added efficiency)
  * Added HEAD support (doesn't attempt to send code)

1.1.0 / 2013-03-24
==================

  * update browserify to 2.8.0

1.0.0 / 2013-03-24
==================

  * gzip
  * e-tags
  * documentation

0.0.1 / 2013-03-15
==================

  * Initial release