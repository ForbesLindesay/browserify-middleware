var hyperquest = require('hyperquest');
var concat = require('concat-stream');
hyperquest('http://localhost:3000/ajax')
  .pipe(concat(function (res) {
    console.log(res);
  }))
