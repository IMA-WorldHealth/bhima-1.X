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

  return {
    detail : detail
  };
}

// Utility method - pass only data object to controller
// TODO Use shared utility service
function extractData(result) { 
  return result.data;
}
