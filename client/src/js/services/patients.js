'use strict'

/**
 * @description 
 *
 * @returns 
 */

angular.module('bhima.services')
  .factory('Patients', Patients);
  
Patients.$inject = ['$http'];

function Patients($http) {  
  
  function detail(uuid) { 
    var path = '/patients/';

    return $http.get(path.concat(uuid))
      .then(extractData);
  }

  function create(details) { 
    var path = '/patients';

    return $http.post(path, details);
  }

  return {
    detail : detail,
    create : create
  };
}


// Utility method - pass only data object to controller
// TODO Use shared utility service
function extractData(result) { 
  return result.data;
}
