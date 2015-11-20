angular.module('bhima.services')
.service('CashboxService', CashboxService);

CashboxService.$inject = [ '$http', 'util' ];

/**
* Cashbox Service
*
*/
function CashboxService($http, util) {
  var service = {};

  service.list = list;

  /* ------------------------------------------------------------------------ */

  function list() {
    return $http.get('/cashboxes')
    .then(util.unwrapHttpResponse);
  }
}
