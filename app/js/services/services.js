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
