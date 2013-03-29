var browserify = require('../');
var express = require('express');
var app = express();

browserify.settings.production('cache', '7 days');
browserify.settings.mode = 'production';

app.use('/js', browserify('./client/dir'));
app.get('/js/bundle.js', browserify(['hyperquest', 'concat-stream']));
app.get('/js/file.js', browserify('./client/file.js'));

app.use(express.static(__dirname + '/static'));

app.get('/ajax', function (req, res) {
  res.end('An AJAX request was made using modules that were made available publicly');
});

app.listen(3000);