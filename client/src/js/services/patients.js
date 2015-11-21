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

  // TODO Service could seperate medical and financial details - depending on form build
  function create(details) { 
    var path = '/patients';

    return $http.post(path, details)
      .then(extractData);
  }
  
  // TODO Review/ refactor
  function groups(patientUuid) { 
    
    var path = '/patients/';

    // If a patient ID has been specified - return only the patient groups for that patient
    if (angular.isDefined(patientUuid)) { 
      path = path.concat(patientUuid, '/groups');
    } else { 
      
      // No Patient ID is specified - return a list of all patient groups
      path = path.concat('groups');
    }

    return $http.get(path)
      .then(extractData);
  }

  function logVisit(details) { 
    var path = '/patients/visit';
    
    return $http.post(path, details)
      .then(extractData);
  }

  return {
    detail : detail,
    create : create,
    logVisit : logVisit, 
    groups : groups
  };
}

// Utility method - pass only data object to controller
// TODO Use shared utility service
function extractData(result) { 
  return result.data;
}
