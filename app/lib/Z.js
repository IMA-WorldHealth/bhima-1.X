// Z.js
//    Provides helper functions such as data.
// Dependencies:
//


// data: Namespace
// 
// Currently supports:
//    data.store: Module

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

  // SocketStore
  // options = {
  //  id: 1,
  //  identifier: 'id',  // equivilent to idProperty
  //  table: 'account',  // or "account-account_type"
  //  columns: ['id', 'account_txt'],
  // }
  //  
  function SocketStore(options) {
    var port       = options.port || 8000, // default to port 8000
        identifier = options.identifier,
        table      = options.table,
        columns    = options.columns,
        autosync   = options.autosync || false, // autosync defaults to false
        store      = new Store({idProperty: identifier}),
        connection = new WebSocket('ws://127.0.0.1:' + port),
        ready      = false,
        socketid   = null, // this is set in a server-response to init()
        changes    = [];
        datastate = store.data;

    // helper functions
    function serialize (input) {
      return JSON.stringify(input);
    }

    function deserialize (input) {
      return JSON.parse(input);
    }

    // test to see how the connections work
    var open = connection.onopen = function () {
      // initialize
      init();
    };
 
    // first method anything from the server encounters
    var receive = connection.onmessage = function (rawpacket) {
      // deserialize and route
      var packet = deserialize(rawpacket.data);
      return router(packet);
    };

    var error = connection.onerror = function (errorpacket) {
      console.log("WebSocket Error:", errorpacket); 
    };
   
    // send data to the server
    function send (rawpacket) {
      // serialize and send
      var packet =  serialize(rawpacket);
      connection.send(packet);
    }

    // To initialize the connection
    function init () {
      var parameters = {
        method     : 'INIT',
        table      : table,
        columns    : columns,
        identifier : identifier
      };
      send(parameters);
    }
  
    function router (packet) {
      var methods = {
        'PUT'    : route_put,
        'REMOVE' : route_remove,
        'INIT'   : route_init
      };

      // only fired one. FIXME: make this better/standardized
      if (!socketid) { socketid = packet.socketid; }

      // call the appropriate method with the packet's data
      // DISCUSS: Should this use the whole packet?
      methods[packet.method](packet.data);
    }

    // puts data from the server into the store
    function route_put (data) {
      store.put(data);
    }

    // removes data from the store on server's request
    function route_remove(id) {
      store.remove(id);
    }

    // populates data in the store from the server
    function route_init (data) {
      store.setData(data);      // set the store data
      ready = true;             // set ready to be true
    }

    // External API
    function get (id) {
      // summary
      //    Queries the store. The store is assumed to
      //    always be up to date with the server.
      return store.get(id);
    }
  
    // External API
    function put (object, opts) {
      // summary:
      //    Puts an object in the local store and 
      //    either records changes or syncs them
      //    back to the server, depending on how the
      //    script was initialized.
      // returns: Boolean
      var success, parameters;
      if (!(identifier in object)) {
        throw new Error("No identifying property supplied.");
      }
     
      // this is fast: don't worry about it
      var exists = store.get(object[identifier]);
      var method = (exists) ? 'UPDATE' : 'INSERT';

      success = store.put(object, opts);

      console.log("socketid:", socketid);
      parameters = {
        socketid : socketid,
        method   : method,
        data     : object
      };
      console.log("Autosync:", autosync);
      if (success && autosync) {
        // Success! Now send the query to the server
        send(parameters);
        return true;
      }
      if (success && !autosync) {
        // Success! Now push to changes to a list for later syncing
        changes.push(parameters);
        return true;
      }
      // something strange happened.
      return false;
    }
  
    // External API
    function remove (id) {
      var success, parameters;
      success = store.remove(id);
      parameters = {
        socketid : socketid,
        method: 'REMOVE',
        data: id
      };

      if (success && autosync) {
        // local store delete succeeded
        send(parameters);
        return true;
      }
      if (success && !autosync) {
        changes.push(parameters);
        return true;
      }
      return false;
    }

    // External API
    function sync () {
      // summary:
      //    Loop through all the directives in 
      //    "changes" and send each one to the
      //    server.  No roll-back supported yet,
      //    but the structure is here.
      for (var i = 0, l = changes.length; i < l; i++){
        send(changes[i]);
      }
    }

    // Return external API
    return {
      put: put,
      remove: remove,
      get: get,
      sync: sync,
    };
  
  }

  // returns to global namespace
  return {
    Store : Store,
    SocketStore : SocketStore
  };
})();




// FIXME: improve this, it looks gross.
// util: namespace
//
// Currently Supports:
//  util.mixin()
var util = (function() {

  function isArray (obj) {
    // test whether object is an array
    return (obj && obj.length && Object.prototype.toString.call(obj) == '[object Array]');
  }

  // copy object properties 
  function mixObject (object) {
    var copy = {}, key, value;
    // catch typeof null == object
    if (!object) { return null; }
    for (key in object) {
      // faster lookups
      value = object[key];
      if (object.hasOwnProperty(key) && object.propertyIsEnumerable(key)) {
        if (typeof value == "object") {
          // complex value: mix in either array or another object
          copy[key] = (isArray(value)) ? mixArray(value) : mixObject(value);
        } else {
          // simple value
          copy[key] = value;
        }
      }
    }
    return copy;
  }

  // copy array properties
  function mixArray (array) {
    var l = array.length, i = 0, copy = Array(l), value;
    for (i; i < l; i++) {
      value = array[i];
      if (value && typeof value == 'object') {
        copy[i] = (isArray(value)) ? mixArray(value) : mixObject(value);
      } else {
        copy[i] = value;
      }
    }
    return copy;
  }

  // mixin two objects, optionally preserving the first
  // object's properties
  function mixin(primary, secondary, safeMixin) {
    // Mixes two objects together by copying over properties
    // safeMixin does not overried properties of primary
    var mixed = {}, key, value;
    for (key in primary) {
      value = primary[key];
      // skip prototypes and mix deeply for arrays
      if (primary.hasOwnProperty(key) && primary.propertyIsEnumerable(key)) {
        if (typeof value == "object") {
          // complex value - array or object
          mixed[key] = (isArray(value)) ? mixArray(value) : mixObject(value);
        } else {
          // simple value
          mixed[key] = value;
        }
      }
    }
    for (key in secondary) {
      value = secondary[key];
      // Make sure we skip if safeMixin is defined
      // and mixed[key] exists
      if (!(safeMixin && mixed[key])) {
        if (secondary.hasOwnProperty(key) && secondary.propertyIsEnumerable(key)) {
          if (typeof value == "object") {
            // complex value - array or object
            mixed[key] = (isArray(value)) ? mixArray(value) : mixObject(value);
          } else {
            // simple value
            mixed[key] = value;
          }
        }
      }
    }
    return mixed;
  }
  return {
    mixin: mixin
  };

})();
