/**
 * bhima-mail-plugin utilities
 *
 * These are used in index.js for various purposes.
 */

// generate a uuid version 4
function uuid() {
  'use strict';

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
    v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// recurively loops through an object (tree), applying the
// function fn to each value in the tree.
function umap(object, fn) {
  'use strict';

  for (var key in object) {
    if (typeof object[key] === 'object' && object[key] !== null) {

      // descend a level
      umap(object[key], fn);
    } else {

      // apply the function
      object[key] = fn(object[key]);
    }
  }

  return object;
}

exports.uuid = uuid;
exports.map = umap;
