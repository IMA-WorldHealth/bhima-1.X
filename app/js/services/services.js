// Services.js
(function (angular) {
  'use strict';
  
  var services = angular.module('bika.services', []);
  
  services.service('bikaConnect', function($http) { 
    console.log("bikaConnect initialised.");
    //TODO: Define API for getting data from the server - providing query data, simple table names, etc.
    this.fetch = function(table, columns, where, value) { 
    
    var query = { 
      e: [{t : table, c : columns}]
    };
    
    if(where) { 
      query.c = [{t : table, cl : where, v : value, z : '='}];
    }
    
    console.log("query", query);
    
    
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
  });

  services.factory('appstate', function($q) { 
    var comp = {};
    var queue = {};

    //reference to the value (bound with ng-model) of a component
    function set(id, ref) { 
      comp[id] = ref;
      notifyQueue(id);
    }

    function get(id) { 
      var deferred = $q.defer();

      if(comp[id]) { 
        console.log("appstate ")
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
      set : set, 
      get : get
    };

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
          ready = $q.defer(),
          socketid   = null, // this is set in a server-response to init()
          changes    = [];
      
      this.identifier = identifier;
      this.data = null;
      this.index = null;
      this.ready = ready; // refers to ready above

      this.setData = function (data) {
        this.data = data;
        this.index = {};
        for (var i = 0, l = data.length; i < l; i++) {
          this.index[data[i][this.identifier]] = i;
        }
      };

      var open = connection.onopen = function () { init(); };
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
        self.setData(data);
        console.log("Received data. Resolving...");
        self.ready.resolve();
      }
  
      this.get = function (id) {
        var q = $q.defer(),
            promise = this.ready.promise,
            self = this;
        promise.then(function() { console.log("Resolved."); });
        promise.then(function(res) {
          q.resolve(self.data[self.index[id]]);
        }); 
        return q.promise;
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

          parameters = {
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
    //return object with get/put/delete/update functions 
    //index ids for quick get
    //maintain scope in functions for either pushing straight to server or keeping ttrack of changes (flag)
    
    //TODO: 
    //  -data is assumed to be indentifiable with 'id'
    
    //keep track of requests thus far 
    var requests = {};

    function req(table, columns, where, value) { 
      console.log("Module requested", table);
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
      req : req
    };
  });

})(angular);
