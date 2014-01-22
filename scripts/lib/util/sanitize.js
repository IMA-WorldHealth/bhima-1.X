// lib/util/sanitize.js

module.exports = {

  // this is not incredibly secure
  escapeid : function (id) { return ['`', id, '`'].join(''); },

  escape: function (str) { return (!Number.isNaN(Number(str)) || ~str.indexOf('"')) ? str : '"' + str + '"'; },

  isInt : function (n) { return (Math.floor(n) === Number(n)); },

  isIn : function (s) {  return String(s).indexOf('(') > -1; },

  isFloat : function (f) { return parseFloat(f) !== undefined && ~f.toString().indexOf('.'); },

  // this also works for hexadecimal ('0x12')
  isNumber: function (n) { return !Number.isNaN(Number(i)); },

  isArray: function (arr) { return Object.prototype.toString.call(arr) == '[object Array]'; },

  isString: function (str) { return typeof str == 'string'; },

  isObject: function (obj) { return Object.prototype.toString.call(obj) == '[object Object]'; },

  // is there a better way to do this?
  isUndefined : function (u) { return u === undefined; },
  
  isDefined : function (d) { return !this.isUndefined(u); }

};
