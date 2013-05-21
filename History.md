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