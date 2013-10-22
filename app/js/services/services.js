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

  services.factory('appstate', function($q) { 
    /////
    // summary: 
    //  generic service to share values throughout the application by id - returns a promise that will either be populated or rejected
    //  to allow asynchronous loading
    /////
    var comp = {};
    var queue = {};

    function set(id, ref) { 
      //summary: 
      //  assign reference to id, notify anyone waiting on id
      comp[id] = ref;
      notifyQueue(id);
    }

    function get(id) { 
      //summary: 
      //  get reference to a value/ model by id, if the id exists it is returned, otherwise deferred is added to a queue to be 
      //  resolved later
      var deferred = $q.defer();

      if(comp[id]) { 
        deferred.resolve(comp[id]);
      } else { 
        register(id, deferred);
      }

      return deferred.promise;
    }

    function register(id, deferred) { 
      if(!queue[id]) { 
        queue[id] = [];
      }
      queue[id].push(deferred);
    }

    function notifyQueue(id) { 
      if(queue[id]) { 
        queue[id].forEach(function(deferred) { 
          deferred.resolve(comp[id]);
        });
      }
    }

    return {
      //summary: 
      //  expose required function to Angular modules, all other functions are considered private
      set : set, 
      get : get
    };

  });

  services.factory('data', function($q, $rootScope) {

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
      function send (rawpacket) { connection.send(serialize(rawpacket)); }
 
      function init () {
        var parameters = {
          method     : 'INIT',
          table      : table,
          columns    : columns,
          identifier : identifier
        };
        send(parameters);
      }
      
      this.ready = function () {
        return q.promise;
      };
    
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
        q.resolve();
        $rootScope.$apply();
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
        var exists = store.get(object[identifier]);
        var method = (exists) ? 'UPDATE' : 'INSERT';
  
        parameters = {
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

    }

    var registry = {};

    function register(options) {
      var table = options.table,
          store;

      if (registry[table]) {
        // this is a store currently in use 
        return registry[table];
      } else {
        store = new SocketStore(options);
        registry[table] = store;
        return store;
      }
    }

    return {
      register: register,
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
