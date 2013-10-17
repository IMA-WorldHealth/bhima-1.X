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

  //FIXME: written with a truly naive understanding of angular and services
  //       ++(can't think right now, don't even think this stuff makes sense)
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
