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
  services.service('appService', function(bikaConnect, $q) { 
    var comp = {};
    var handle = {};

    //Use defereds to return the value of something (get) WHEN it is set, vs. returning null
    function link(id) { 
      return function(newObj, oldObj) { 
        console.log("Service tracking", id, newObj);
      }
    }
    //reference to the value (bound with ng-model) of a component
    this.set = function(id, ref) { 
      comp[id] = ref;
      //handle[id] = $watch('comp[id]', link(id)); 
    }

    this.get = function(id) { 
      return comp[id];
    }

    this.register = function(id, callback) { 

    }

  });

  services.factory('connect', function($http, $q) { 
    //return object with get/put/delete/update functions 
    //index ids for quick get
    //maintain scope in functions for either pushing straight to server or keeping ttrack of changes (flag)
    
    //TODO: 
    //  -data is assumed to be indentifiable with 'id'
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
        deferred.resolve(packageModel(model, returned.data));
      });

      return deferred.promise;

    }

    function packageModel(model, data) { 

      model.index = {};
      model.data = data;

      //determine indexs
      model.calculateIndex = function() { 
        for (var i = this.data.length - 1; i >= 0; i--) {
            this.index[this.data[i]["id"]] = i;
        };
      }

      //data manipulation
      model.get = function(id) { 
        return this.data[this.index[id]];
      }

      model.delete = function(id) { 
        if(id in this.index) { 
          this.data.splice(index[id], 1);
          return true;
        }
      }

      //initialise index
      model.calculateIndex();
      return model;
    }

    //Check we haven't made this query before this session, check we don't have the data stored in local storage
    //-verify version numbers of data if it has been cached (see priority levels etc.)
    function referenceQuery(query) { 

    }

    return { 
      req : req
    };
  });

})(angular);
