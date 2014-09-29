
// /scripts/lib/util/store.js
// the data store, similar to Dojo's Memory Store.

console.log('[store] Configuring store');

'use strict';

var store = {};

// globals
var options = options || {};
store.index = {};
store.data = [];

// locals
var identifier = options.identifier || 'id'; // id property

// set an array of data
store.setData = function (data) {
  var index = store.index = {};
  store.data = data;

  for (var i = 0, l = data.length; i < l; i += 1) {
    index[data[i][identifier]] = i;
  }
};

// constructor function
var self = store;
(function contructor () {
  for (var k in options) {
    self[k] = options[k];
  }
  // set data if it is defined
  if (options.data) { self.setData(options.data); }
})();

// get an item from the local store
store.get = function (id) {
  return store.data[store.index[id]];
};

// put is for UPDATES
store.put = function (object, opts) {
  var data = store.data,
      index = store.index,
      id = object[identifier] = (opts && 'id' in opts) ? opts.id : identifier in object ?  object[identifier] : false;

  // merge or overwrite
  if (opts && opts.overwrite) {
    data[index[id]] = object; // overwrite
  } else {
    var ref = data[index[id]] || {};
    for (var k in object) {
      ref[k] = object[k]; // merge
    }
  }
};

// post is for INSERTS
store.post = function (object, opts) {

  var data = store.data,
      index = store.index,
      id = object[identifier] = (opts && 'id' in opts) ? opts.id : identifier in object ?  object[identifier] : Math.random();
  index[id] = data.push(object) - 1;
};

store.remove = function (id) {
  var data = store.data,
      index = store.index;

  if (id in index) {
    data.splice(index[id], 1);
    store.setData(data);
  }
};

store.contains = function (id) {
  // check to see if an object with
  // store id exists in the store.
  return !!store.get(id);
};

store.recalculateIndex = function () {
  var data = store.data, index = store.index;
  for (var i = 0, l = data.length; i < l; i += 1) {
    index[data[i][identifier]] = i;
  }
};

module.exports = function () { return store; };
