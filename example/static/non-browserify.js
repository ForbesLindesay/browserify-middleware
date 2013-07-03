var hyperquest = require('hyperquest');
var concat = require('concat-stream');
hyperquest('/ajax')
  .pipe(concat(function (res) {
    console.log(res);
  }))