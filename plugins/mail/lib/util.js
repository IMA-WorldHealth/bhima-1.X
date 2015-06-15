/**
 * mail plugin utilities
 *
 */

// generate a uuid version 4
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
    v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// recurively loops through an object (tree), applying the
// function fn to each value in the tree.
function recurse(object, fn) {
  for (var key in object) {
    if (typeof object[key] === 'object' && object[key] !== null) {

      // descend a level
      recurse(object[key], fn);
    } else {

      // apply the function
      fn(object, key);
    }
  }
}

exports.uuid = uuid;
exports.recurse = recurse;
