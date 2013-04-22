//patch syntax-error because it has a horrible bug
(function (se) {
  var read = require('fs').readFileSync;
  var write = require('fs').writeFileSync;
  write(se, read(se, 'utf8').replace('new SyntaxError', 'Object.create(SyntaxError.prototype)'), 'utf8');
}(require.resolve('syntax-error')));