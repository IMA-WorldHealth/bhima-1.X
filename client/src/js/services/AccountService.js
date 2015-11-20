angular.module('bhima.services')
.service('AccountService', AccountService);

AccountService.$inject = ['$http', 'util'];

/**
* Account Service
*/
function AccountService($http, util) {
  var service = this;
  
  service.list = list;

  function list() {
    return $http.get('/accounts')
      .then(util.unwrapHttpResponse);
  }

  return service;
}
