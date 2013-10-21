var data = (function() {

  // Module: Store
  //    Creates an object store based off of
  //    Dojo's Memory Store for keeping a persistent
  //    collection of objects, indexed by id.
  //    
  //    Optimized for fast lookups, writes can
  //    be a bit slower.
  function Store(options) {
    options = options || {};

    // idProperty : String
    //    Defaults to "id" if none supplied
    this.idProperty = options.idProperty || "id";

    // data : Array
    //    The data in the store
    this.data = null;

    // index : Array
    //    An index by idProperty into the 
    //    data of the store.
    this.index = null;
    
    // FIXME: This is unreferenced. Do we need this? 
    // getIdentity: Function
    //    Given a general object, return 
    //    the value associated with its
    //    idProperty.
    function getIdentity (object) {
      return object[idProperty]; 
    }

    // get : Function
    //    returns an element/object from the
    //    store that matches the id provided
    this.get = function (id) {
      // summary:
      //    returns an element/object from the
      //    store that matches the id provided.
      // id: Number || String 
      //    The id of of the object
      // returns: Object
      return this.data[this.index[id]];
    };

    this.put = function (object, opts) {
      // summary:
      //    Stores an object
      // object: Object
      //    The object to store
      // options: Object
      //    Additional metadata for storing the data
      // returns: Number
      var data = this.data,
        index = this.index,
        idProperty = this.idProperty;
      // construct a unique id
      var id = object[idProperty] = (opts && "id" in opts) ? opts.id : idProperty in object ? object[idProperty] : Math.random();
      
      if (id in index) {
        // object.exists
        var ref = data[index[id]];
        if (opts && opts.replace === false) {
          // replace the entry in data
          data[index[id]] = object;
        } else {
          for (var key in object) {
            // iterate over all incoming values
            // and update the stored object
            ref[key] = object[key];
          }
        }
      } else {
        // add the new object
        index[id] = data.push(object) - 1;
      }
      return id;
    };

    this.remove = function (id) {
      // summary:
      //    Deletes an object by its identity
      // id: Number
      //    The identity to use to delete the object
      // returns: Boolean
      //    Returns true if the object was removed, falsy if not
      var index = this.index,
        data =  this.data;
      if (id in index) {
        data.splice(index[id], 1);
        // now we have to reindex
        this.setData(data);
        return true;
      }
    };

    this.setData = function (data) {
      // summary:
      //    Sets the given data as the sorce for this store and indexes it
      // data: Object[]
      //    Ann array of objects to use as the source of data.
      this.data = data;
      this.index = {};
      for (var i = 0, l = data.length; i < l; i++) {
        this.index[data[i][this.idProperty]] = i;
      }
    };

    var self = this;
    // runs upon instantiation
    (function constructor () {
      for (var key in options) {
        self[key] = options[key];
      }
      self.setData(options.data || []);
    })();

    return this;
  }

  return {
    Store: Store
  };
})();

module.exports = data;
