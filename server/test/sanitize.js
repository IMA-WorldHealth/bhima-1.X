// tests for sanitize.js

var s = require('../lib/util/sanitize');

exports.testSanitize = function (test) {

  test.ok(s.isArray([1,2,'s']), 'sanitize.isArray() fails for mixed array!');
  test.ok(!s.isArray({id: 1}), 'sanitize.isArray() falsely recognizes objects!');
  test.ok(!s.isArray('[1,2]'), 'sanitize.isArray() falsely recognizes strings!');
  test.ok(!s.isArray(1), 'sanitize.isArray() falsely recognizes number!');

  test.equal(s.escapeid('id'), '`id`', 'sanitize.escapeid() incorrectly escapes strings!');

  test.equal(s.escape('id'), '"id"', 'sanitize.escape() incorrectly escapes strings!');
  test.strictEqual(s.escape(1), 1, 'sanitize.escape() escapes numbers!');
  test.equal(s.escape('12.4'), 12.4, 'sanitize.escape() escapes floating numbers!');

  test.ok(s.isInt(0), 'sanitize.isInt() fails for zero!');
  test.ok(s.isInt(3), 'sanitize.isInt() fails for real number!');
  test.ok(s.isInt('3'), 'sanitize.isInt() fails for string!');

  test.ok(s.isFloat(3.5), 'sanitize.isFloat() fails for number!');
  test.ok(s.isFloat('3.5'), 'sanitize.isFloat() fails for strings!');
  test.ok(!s.isFloat('5'), 'sanitize.isFloat() falsely recognizes integers!');

  test.ok(s.isObject({}), 'sanitize.isObject() fails to recognize an object!');
  test.ok(!s.isObject('string'), 'sanitize.isObject() incorrectly recognizes strings!');

  test.ok(s.isString('string'), 'sanitize.isString() fails to recognize strings!');
  test.ok(!s.isString(3), 'sanitize.isString() recognizes numbers!');

  test.done();
};
