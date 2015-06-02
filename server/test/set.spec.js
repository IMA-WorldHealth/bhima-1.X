var expect = require('chai').expect,
    Set = require('../lib/set');

describe('set', function () {

  describe("#init()", function () {

    it('should initialize an empty array', function () {
      var set = new Set();
      expect(set.set).to.be.empty;
    });

    it('should initialize with unique values if called with an array', function () {
      var set = new Set([1, 1, 2, 3, 4, 1]);
      expect(set.set).to.eql([1,2,3,4]);
    });

  });

  describe('#insert()', function () {

    it('should add an item to a set with insert()', function () {
      var set = new Set();

      set.insert('a');

      var results = set.set;
      var answer = ['a'];

      expect(results).to.eql(answer);
    });

    it('should not add a second item of the same value', function () {
      var set = new Set();

      set.insert('a');
      set.insert('b');
      set.insert('c');

      // Now try adding 'b' again
      set.insert('b');

      var results = set.set.sort();
      var answer = ['a', 'b', 'c'];

      expect(results).to.eql(answer);
      });
  });


  describe('#remove()', function () {

    it('should remove item to a set with remove()', function () {
      var set = new Set();

      set.insert('a');
      set.insert('b');
      set.insert('c');

      // Now remove 'b'
      set.remove('b');

      var results = set.set;
      var answer = ['a', 'c'];

      expect(results).to.eql(answer);
    });


    it('should not remove a non-existant set memberf with remove()', function () {
      var set = new Set();

      set.insert('a');
      set.insert('b');
      set.insert('c');

      // Now remove 'd'
      set.remove('d');

      var results = set.set;
      var answer = ['a', 'b', 'c'];

      expect(results).to.eql(answer);
    });
  });


  describe('#index()', function () {

    it('should get the index item in a set with index()', function () {
      var set = new Set();

      set.insert('b');
      set.insert('a');
      set.insert('c');

      var results = [set.index('a'), set.index('b'), set.index('c')];
      var answer = [1, 0, 2];

      expect(results).to.eql(answer);
    });

    it('should get negative index for an item not in a set with index()', function () {
      var set = new Set();

      set.insert('b');
      set.insert('a');
      set.insert('c');

      var results = set.index('d');
      var answer = -1;

      expect(results).to.eql(answer);
    });

  });
});
