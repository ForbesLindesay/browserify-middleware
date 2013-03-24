# browserify-middleware

express middleware for browserify v2 with sensible defaults for the ultimate in ease of use.

[![Build Status](https://travis-ci.org/ForbesLindesay/browserify-middleware.png?branch=master)](https://travis-ci.org/ForbesLindesay/browserify-middleware)
[![Dependency Status](https://gemnasium.com/ForbesLindesay/browserify-middleware.png)](https://gemnasium.com/ForbesLindesay/browserify-middleware)

## Usage

See `example` directory for a complete server

```javascript
var browserify = require('browserify-middleware');
var express = require('express');
var app = express();

//provide browserified versions of all the files in a directory
app.use('/js', browserify('./client/dir'));

//provide a browserified file at a path
app.get('/js/file.js', browserify('./client/file.js'));

//provide a bundle exposing `require` for a few npm packages.
app.get('/js/bundle.js', browserify(['hyperquest', 'concat-stream']));

app.listen(3000);
```

P.S. file paths are relative to `__dirname` of caller, not relative to `process.cwd()`.  This is much more intuitive.

## Multiple Bundles Example

Multiple bundles can sometimes lead to better caching performance.  If you had multiple different JavaScript modules in `./client` that all depended on `hyperquest` and `concat-stream` and were used on different pages, you may want to split those two modules into separate files so that they are only loaded once for someone browsing arround the site:

```javascript
var shared = ['hyperquest', 'concat-stream'];
app.get('/js/bundle.js', browserify(shared));
app.use('/js', browserify('./client', {external: shared}))
```

Then on your HTML pages you can just have:

page1.html
```html
<script src="/js/bundle.js"></script>
<script src="/js/beep.js"></script>
```

page2.html
```html
<script src="/js/bundle.js"></script>
<script src="/js/boop.js"></script>
```

This way, booth `beep.js` and `boop.js` can `require` the shared modules (`hyperquest` and `concat-stream`) but they aren't actually contained within that file.

## API

### browserify(path, options)

#### path

If the path is a relative path, it is treated as relative to the file which called `browserify`, not relative to the current working directory.  This lets you just use paths like you would with require, instead of worrying about `join` and `__dirname` etc.

If path is a relative or absolute path to a "directory" then the entire directory is served, including subdirectories.  All JavaScript files in that directory are made available through browserify.

If path ia a relative or absolute path to a "file" then that file is served.

If path is an array of module names, those modules are served, in a form that allows them to be loaded on the client side using `require`.

#### options

There are two types of options, those that impact "Serving" and those that impact "Bundling".  All the options have super-sensible defaults, so you probably won't need to touch any of them.  You will need to use the `external` option if using the "multiple bundles" feature.  You will need to use `options.transform` if you wish to work in an alternative language (such as coffee-script) or support loading text files (with something like [rfileify](https://github.com/ForbesLindesay/rfileify)).

##### Serving

- `opitons.cache` - Should files be cached in memory (default: `true` in production `false` in development)
- `options.minify` - Should the files be minified before serving (default: `true` in production `false` in development)
- `options.gzip` - Should the files be gzipped when supported by the client (default: `true` in production `false` in development)

##### Bundling

- `options.external` - an array of module names that will be required from external bundles (see [browserify/multiple bundles](https://github.com/substack/node-browserify#multiple-bundles)) (default: `[]`)
- `options.ignore` - an aray of module names that are prevented from showing up in the output bundle (default: `[]`)
- `options.ignoreMissing` - set to `true` to ignore errors when a module can't be found (default: `false`).
- `options.transform` - an array of strings or functions to transform top level modules (default: `[]`).
- `options.insertGlobals` - set to true to always insert `process`, `global` etc. without analysing the AST for faster builds but larger bundles (Note that `options.minify` may cause the globals to be removed again anyway) (default: false)
- `options.detectGlobals` - set to false to skip adding `process`, `global` etc.  Setting this to false may break more npm modules (default: true).
- `options.debug` - Should source maps be enabled for easier debugging (default: `false` in production `true` in development)