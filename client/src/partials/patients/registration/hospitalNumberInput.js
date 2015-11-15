angular.module('bhima.directives')
.directive('hospitalNumber', HospitalNumber);
  
HospitalNumber.$inject = ['$q', '$http', '$timeout'];

function HospitalNumber($q, $http, $timeout) { 
  
  return { 
    require : 'ngModel',
    link : function (scope, elm, attrs, ctrl) { 

      ctrl.$asyncValidators.hospitalNumber = function (modelValue, viewValue) { 
        var deferred;
        var path = '/patients/checkHospitalId/';

        if (ctrl.$isEmpty(modelValue)) { 
          return $q.when();
        }

        deferred = $q.defer();
        
        $http.get(path.concat(modelValue))
          .then(function (result) { 
            var hospitalNumberStatus = result.data;

            if (hospitalNumberStatus.registered) { 
              deferred.reject();
            } else { 
              deferred.resolve();
            }
          })
          .catch(function (error) { 

            // TODO Pass error back up through to controller to handle generic errors
            deferred.reject();
          });
        
        return deferred.promise;
      }
    }
  }
}
