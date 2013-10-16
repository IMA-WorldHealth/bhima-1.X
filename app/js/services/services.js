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

  services.service('connect', function($http) { 

  });

})(angular);
