var q = require('Q');
module.exports = (function(db) { 
  'use strict'

  function generate(request, callback) { 
    /*summary 
    *   Route request for reports, if no report matches given request, return null  
    */
    var route = {
      'finance' : finance
    }

    route[request]().then(function(report) { 
      callback(report);
    });
  }

  function finance() { 
    var deferred = q.defer();
    
    var initial_query;
    return deferred.promise;
  }

  return { 
    generate: generate
  }
});