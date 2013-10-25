// Services.js
//TODO: Define API for getting data from the server - providing query data, simple table names, etc.

(function (angular) {
  'use strict';
  
  var services = angular.module('bika.services', []);
    
  //FIXME: depricated - yo
  services.service('bikaConnect', function($http) { 
    this.fetch = function(table, columns, where, value) {     
      var query = { 
        e: [{t : table, c : columns}]
      };
      
      if(where) { 
        query.c = [{t : table, cl : where, v : value, z : '='}];
      }
      
      var promise = $http.get('/data/?' + JSON.stringify(query)).then(function(result) { 
          // I can now manipulate the data before returning it if needed
          return result.data;
        });
        return promise;
    };
    
    //Because TODO
    this.raw_fetch = function(qeury_object) { 
      var promise = $http.get('/data/?' + JSON.stringify(qeury_object)).then(function(result) { 
        return result.data;
      });
      return promise;
    };

    
    this.get = function(target, requestObject){
      var promise = $http.get(target + JSON.stringify(requestObject)).then(function(result) { 
        return result.data;
      });
      return promise;
  };

  this.send = function(table, data) { 
    var sql= {t:table, data:data};
    $http.post('data/',sql);
  };

  this.update = function(objectRequest) { 
    $http.put('data/',objectRequest);
  }   
  });

  services.service('bikaUtilitaire', function() { 
    this.formatDate = function(dateString) {
      return new Date(dateString).toDateString();
    };

    Date.prototype.toMySqlDate = function (dateParam) {
      console.log("dateParam:", dateParam);
      var date = new Date(dateParam), annee, mois, jour;
      annee = String(date.getFullYear());
      mois = String(date.getMonth() + 1);
      if (mois.length === 1) {
       mois = "0" + mois;
      }

      jour = String(date.getDate());
        if (jour.length === 1) {
          jour = "0" + jour;
      }      
      return annee + "-" + mois + "-" + jour;
    };

    this.convertToMysqlDate = function(dateString) {
      return new Date().toMySqlDate(dateString);
    }
  });

  services.factory('appcache', function($q) { 
    /////
    // summary: 
    //  Used to interface with indexedDB store, providing methods to read and write to local storage
    //  
    // TODO:
    //  -Formalise inner working functions, and expose high level requests (storage for page save, namespacing etc.)
    //  -Use multiple indexs (injected on request)
    /////
    console.log("appcache initialised");

    var cache_supported;
    if("indexedDB" in window) { 
      cache_supported = true;
    }

    //variables inside if(cache_supported)? no need to initialise otherwise
    var db;
    var version = 2;

    var instance = { 
      add: add,
      getNav: getNav,
      cacheNav: cacheNav
    };

    var queue = [];

    //Methods for storing navigation data - FIXME: Should service be more abstract than this?
    function getNav() { 
      //FIXME: Redo this function/ queue system
      var deferred = $q.defer();

      if(!db) { 
        queue.push(fetch);
      } else { 
        fetch();
      }

      function fetch() { 
        getByIndex("cache_nav").then(function(res) { 
          if(res) { 
            deferred.resolve(res.value);
          } else { 
            deferred.resolve(res);
          }
        });
      }

      return deferred.promise;
    }

    function cacheNav(nav_string) {

      if(!db) { 
        queue.push(commit);
      } else { 
        commit();
      }

      function commit() { 
        var promise = getByIndex("cache_nav");
        promise
        .then(function(res) { 
          if(!res) { 
            return add({"ref": "cache_nav", "value" : ""});
          }
        });
      }
      
      update("cache_nav", "value", nav_string);
    }

    function init() { 
      var req = indexedDB.open("bika", version);

      req.onupgradeneeded = function(e) { 
        //summary: 
        //  user is either new, or a newer version of the database is available, run database settup 
        console.log("[appcache] upgrading indexed");
        var checkDB = e.target.result;

        if(!checkDB.objectStoreNames.contains("session")) { 
          var store = checkDB.createObjectStore("session",  {autoIncrement: true});
          store.createIndex("ref", "ref", {unique:true});
        }
      }

      req.onsuccess = function(e) { 
        db = e.target.result;

        //Call all methods requested befored db init
        queue.forEach(function(callback) { 
          callback();
          //delete callback
        });
        
      }

      req.onerror = function(e) { 
        throw new Error(e);
      }
    }

    function add(object) { 
      var deferred = $q.defer();
      if(db) { 
        var transaction = db.transaction(["session"], "readwrite");
        var store = transaction.objectStore("session");

        var req = store.add(object);

        req.onerror = function(e) { 
          console.log("[appcache] Failed to write", e);
          return;
        }

        req.onsuccess = function(e) { 
          //success
          console.log("[appcache] object written");
          deferred.resolve(e.target.value);
        }
      }
      return deferred;
    }

    function put(object) { 
      if(db) { 
        var transaction = db.transaction(["session"], "readwrite");
        var store = transaction.objectStore("session");
        
        var req = store.put(object);

        req.onsuccess = function(e) { 
          console.log("Value updated", object);
        }

        req.onerror = function(e) { 
          console.log("[appcache] Failed to put", e);
        }
      }
    }

    function update(key, field, value) { 
      if(db) { 
        var transaction = db.transaction(["session"], "readwrite");
        var store = transaction.objectStore("session");
        var index = store.index("ref");
        var key_range = IDBKeyRange.only(key);
        
        var req = index.openCursor(key_range);

        req.onsuccess = function(e) { 
          var cursor = e.target.result;
          if(cursor) { 
            //gauranteed to only be one object given key range / key
            var res = cursor.value;
            res[field] = value;
            cursor.update(res);
          }
          console.log("[appcache] updated", key);
        }

        req.onerror = function(e) { 
          console.log("[appcache] Failed to update");
        }
      }
    }

    function get(key) { 
      var transaction = db.transaction(["session"], "readonly");
      var store = transaction.objectStore("session");

      var req = store.get(key);

      req.onsuccess = function(e) { 
        console.log("[appcache] Read success", e);
        console.log("[appcache] Result", e.target.result);
        return e.target.result;
      }

      req.onerror = function(e) { 
        console.log("[appcache] Failed to read", e);
      }

    }

    function getByIndex(key) { 
      var deferred = $q.defer();
      var transaction = db.transaction(["session"], "readonly");
      var store = transaction.objectStore("session");
      var index = store.index("ref");
      
      var req = index.get(key);

      req.onsuccess = function(e) { 
        console.log("[appcache] Read success", e);
        console.log("[appcache] Result", e.target.result);
        deferred.resolve(e.target.result);
      }

      req.onerror = function(e) { 
        console.log("[appcache] Failed to read", e);
      }

      return deferred.promise;
    }

    function requestAll() { 
      //summary: 
      //  indexedDB cursor demonstration
      var transaction = db.transaction(["session"], "readonly");
      var store = transaction.objectStore("session");

      var cursor = store.openCursor();

      cursor.onsuccess = function(e) { 
        var res = e.target.result;
        if(res) { 
          console.log("key", res.key, "data", res.value);
          res.continue();
        }
      }

      cursor.onerror = function(e) { 
        console.log("[appcache] Failed to read cursor");
      }
    }

    if(cache_supported) { 
      init();
    }

    return instance;

  });

  services.factory('appstate', function($q) { 
    /////
    // summary: 
    //  generic service to share values throughout the application by id - returns a promise that will either be populated or rejected
    //  to allow asynchronous loading
    // 
    // example:
    //  ensuring multiple values are set before loading a page (vs. only registering one dependency)
    /*  function fetch() { 
          var promise = fechFirst();
          //see also: $q.all()
          fetchFirst.then(function(res) { 

            return fetchSecond();
          })
          .then(function(res) { 

          });
        }
        function fetchFirst() { 

        }

        function fetchSecond() { 

        }
    */
    //  
    /////
  
    var instance = {
      //summary: 
      //  expose required function to Angular modules, all other functions are considered private
      id: Date.now(),
      get: get,
      set: set,
      register: register,
      update: update
    };

    var comp = {};
    var queue = {};

    function set(comp_id, ref) { 
      //summary: 
      //  Assign id reference to value
      comp[comp_id] = ref;
    }

    function get(comp_id) { 
      //summary: 
      //  Reference to value by di
      return comp[comp_id];
    }

    function register(comp_id, callback) { 
      var id = this.id;
      if(!queue[comp_id]) { 
        queue[comp_id] = [];
      }

      queue[comp_id].push({ref: this, callback: callback});
      //init call to pass current value
      if(comp[comp_id]) { 
        callback(comp[comp_id]);
      }
    }

    function update(comp_id, value) { 
      comp[comp_id] = value;
      var l = queue[comp_id];
      if(l) { 
        l.forEach(function(recept) { 
          recept.callback(comp[comp_id]);
        });
      }
    }

    return instance;
  });

  services.factory('data', function($q) {

    function serialize (input) { return JSON.stringify(input); }
    function deserialize (input) { return JSON.parse(input); }

    // Socket Store
    function SocketStore(options) {
      var port       = options.port || 8000, // default to port 8000
          identifier = options.identifier,
          table      = options.table,
          columns    = options.columns,
          autosync   = options.autosync || false, // autosync defaults to false
          connection = new WebSocket('ws://127.0.0.1:' + port),
          q          = $q.defer(),
          socketid   = null, // this is set in a server-response to init()
          changes    = [];
      
      this.identifier = identifier;
      this.data = null;
      this.index = null;

      this.setData = function (data) {
        this.data = data;
        this.index = {};
        for (var i = 0, l = data.length; i < l; i++) {
          this.index[data[i][this.identifier]] = i;
        }
      };

      var open = connection.onopen = function () { init(); }; // may hit conflicts with this
      var receive = connection.onmessage = function (rawpacket) { return router(deserialize(rawpacket.data));};
      function send (rawpacket) {
        connection.send(serialize(rawpacket));
      }
 
      function init () {
        var parameters = {};
        for (var k in options) {
          parameters[k] = options[k]; 
        }
        parameters.method = "INIT";
        send(parameters);
      }
      
      function router (packet) {
        var methods = {
          'PUT'    : route_put,
          'REMOVE' : route_remove,
          'INIT'   : route_init
        };
        if (!socketid) { socketid = packet.socketid; }
        methods[packet.method](packet.data);
      }
 
      var self = this;
      function route_put (data) { self.put(data); }
      function route_remove(id) { self.remove(id); }
      function route_init (data) { 
        // initialize
        self.setData(data);
        q.resolve(self);
      }
  
      this.get = function (id) {
        return self.data[self.index[id]];
      };

      this.put = function (object, opts) {
        // store put
        var data = this.data,
          index = this.index,
          identifier = this.identifier;
        var id = object[identifier] = (opts && "id" in opts) ? opts.id : identifier in object ? object[identifier] : Math.random();
        
        if (id in index) {
          var ref = data[index[id]];
          if (opts && opts.replace === false) {
            data[index[id]] = object;
          } else {
            for (var key in object) {
              ref[key] = object[key];
            }
          }
        } else {
          index[id] = data.push(object) - 1;
        }

        //FIXME: update this
        var exists = this.get(object[identifier]);
        var method = (exists) ? 'UPDATE' : 'INSERT';
  
        var parameters = {
          socketid : socketid,
          method   : method,
          data     : object
        };

        if (autosync) { send(parameters); } 
        else { changes.push(parameters); }
        return id;
      };
    
      this.remove = function (id) {
        var index = this.index,
          data =  this.data;
        if (id in index) {
          data.splice(index[id], 1);
          this.setData(data);

          var parameters = {
            socketid : socketid,
            method: 'REMOVE',
            data: id
          };
  
          if (autosync) { send(parameters); }
          else { changes.push(parameters); }
          return true;
        }
      };
  
      this.sync = function () {
        for (var i = 0, l = changes.length; i < l; i++) {
          send(changes[i]);
        }
      };
    
      self = this;
      (function constructor() {
        self.setData(options.data || []); 
      })();

      return q.promise;

    }

    var namespaceRegistry = {};

    function register(options) {
      var table = options.primary || Object.keys(options.tables)[0],
          store;

      if (namespaceRegistry[table]) {
        // this is a store currently in use 
        return namespaceRegistry[table];
      } else {
        store = new SocketStore(options);
        namespaceRegistry[table] = store;
        return store;
      }
    }

    function registrations (options) {
      return Object.keys(namespaceRegistry);
    }

    return {
      register: register,
      registrations: registrations
    };

  });

  services.factory('connect', function($http, $q) { 
    //summary: 
    //  provides an interface between angular modules (controllers) and a HTTP server. Requests are fetched, packaged and returned
    //  as 'models', objects with indexed data, get, delete, update and create functions, and access to the services scope to 
    //  update the server.

    //TODO: 
    //  -generic id property should be injected, currently set as ID
    //  -set flag for automatically flushing model updates to server
    
    //keep track of requests, model can use connect API without re-stating request
    //  model : request
    var requests = {};

    //TODO: doesn't support joins or advanced conditions, socket API should solve this
    function req(table, columns, where, value) { 
      //summary: 
      //  Attempt at a more more managable API for modules requesting tables from the server, implementation
      //  still needs to be finalised, should be deprecated with sockets
      var deferred = $q.defer();
      var model = {};

      var query = { 
        e: [{t : table, c : columns}]
      };

      if(where) { 
        query.c = [{t : table, cl : where, v : value, z : '='}];
      }
    
      var handle = $http.get('/data/?' + JSON.stringify(query)).then(function(returned) { 
        var m = packageModel(model, returned.data);
        requests[m] = {table: table, column: columns, where: where, value: value};
        deferred.resolve(m);
      });

      return deferred.promise;
    }

    function basicReq(reqobj) { 
      //summary: 
      //  return a packaged model given a straight request object
      var deferred = $q.defer();
      var model = {};
      var handle = $http.get('/data/?' + JSON.stringify(reqobj)).then(function(returned) { 
        var m = packageModel(model, returned.data);
        //unable to uniformly set request object, this will cause a problem
        requests[m] = reqobj;
        deferred.resolve(m);
      });

      return deferred.promise;
    }

    function packageModel(model, data) { 

      model.index = {};
      model.data = data;

      //determine indexs
      model.calculateIndex = function() { 
        this.index = {};
        for (var i = this.data.length - 1; i >= 0; i--) {
            this.index[this.data[i]["id"]] = i;
        };
      }

      //data manipulation
      model.get = function(id) { 
        return this.data[this.index[id]];
      }

      model.put = function(object) { 
        var id = object["id"];
        if(id in this.index) { 
          //TODO: Implement overwrite flag/ behaviour
          throw new Error("Object overwrite attempted.");
        } else { 
          //update index and insert object
          this.index[id] = this.data.push(object) - 1;
        }
      }

      model.delete = function(id) { 
        var i = this.index;
        if(id in i) { 
          this.data.splice(i[id], 1);
          this.calculateIndex();
          //Check if changes should be automatically reflected in server etc.
          connect_delete(this, id);
          return true;
        }
      }

      model.flush = function() { 

      }

      //initialise index
      model.calculateIndex();
      return model;
    }

    //Check we haven't made this query before this session, check we don't have the data stored in local storage
    //-verify version numbers of data if it has been cached (see priority levels etc.)
    function referenceQuery(query) { 

    }

    function connect_delete(model, id) { 
      var meta = requests[model];
      console.log(meta);

      //create delete query and pass to server with $http
    }

    return { 
      req : req,
      basicReq : basicReq
    };
  });

})(angular);
