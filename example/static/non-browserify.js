var hyperquest = require('hyperquest');
var concat = require('concat-stream');
hyperquest('/ajax')
  .pipe(concat(function (err, res) {
    if (err) throw err;
    console.log(res);
  }))