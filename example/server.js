var browserify = require('../');
var express = require('express');
var app = express();

var options = {
  debug: false,
  minify: true
};

app.use('/js', browserify('./client/dir', options));
app.get('/js/bundle.js', browserify(['hyperquest', 'concat-stream'], options));
app.get('/js/file.js', browserify('./client/file.js', options));

app.use(express.static(__dirname + '/static'));

app.get('/ajax', function (req, res) {
  res.end('An AJAX request was made using modules that were made available publicly');
});

app.listen(3000);