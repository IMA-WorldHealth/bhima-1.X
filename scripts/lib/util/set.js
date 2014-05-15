// scripts/lib/util/set.js

module.exports = function Set () {
  this.set = [];
  
  this.insert = function insert (item) {
    if (this.index(item) > -1) { return; }
    this.set.push(item);
  };

  this.remove = function remove (item) {
    if (this.index(item) > -1) {
      this.set.splice(this.index(item), 1);
    }
  };

  this.index = function index (item) {
    return this.set.indexOf(item);
  };
};
