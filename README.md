# browserify-middleware

express middleware for browserify v2

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

## API

### browserify(path, options)

If the path is a relative path, it is treated as relative to the file which called `browserify`, not relative to the current working directory.  This lets you just use paths like you would with require, instead of worrying about `join` and `__dirname` etc.

If path is a relative or absolute path to a "directory" then the entire directory is served, including subdirectories.  All JavaScript files in that directory are made available through browserify.

If path ia a relative or absolute path to a "file" then that file is served.

If path is an array of module names, those modules are served, in a form that allows them to be loaded on the client side using `require`.