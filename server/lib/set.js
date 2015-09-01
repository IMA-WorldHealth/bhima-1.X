// scripts/lib/util/set.js

// Set.js keeps an array of unique values similar to an array.

module.exports = function Set(data) {
  'use strict';
  var _t = this;

  data = data || [];

  _t.insert = function insert(item) {
    if (_t.index(item) > -1) { return; }
    _t.set.push(item);
  };

  _t.remove = function remove(item) {
    if (_t.index(item) > -1) {
      _t.set.splice(_t.index(item), 1);
    }
  };

  _t.index = function index(item) {
    return _t.set.indexOf(item);
  };

  // filter to remove duplicated values
  function unique(value, index, self) {
    return self.indexOf(value) === index;
  }

  _t.init = function (array) {
    // filter for unique values
    _t.set = array.filter(unique);
  };

  // initialize with data
  _t.init(data);
};
