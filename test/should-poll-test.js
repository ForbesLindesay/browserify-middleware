var shouldPoll = require('../lib/should-poll.js');
var assert = require('assert');

describe('should-poll', function() {
  it('should be a function', function() {
    assert.equal(typeof shouldPoll, 'function');
  });
  it('should resolve to true or false', function(done) {
    shouldPoll()
    .then(function(pollingEnabled) {
      assert(typeof pollingEnabled === 'boolean');
    })
    .then(done)
    .catch(done);
  });
});
