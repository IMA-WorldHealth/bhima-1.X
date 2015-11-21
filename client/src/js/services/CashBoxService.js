angular.module('bhima.services')
.service('CashboxService', CashboxService);

CashboxService.$inject = [ '$http', 'util' ];

/**
* Cashbox Service
*
*/
function CashboxService($http, util) {
  var service = {};

  service.read = read;
  service.create = create;
  service.update = update;
  service.delete = del;

  /* ------------------------------------------------------------------------ */

  function read(id) {
    var url = (id) ? '/cashboxes/' + id : '/cashboxes';
    return $http.get(url)
      .then(util.unwrapHttpResponse);
  }

  function create(box) {
    $http.post('/cashboxes', { cashbox: box })
      .then(util.unwrapHttpResponse);
  }

  function update(id, box) {
    $http.put('/cashboxes/' + id, { cashbox: box })
      .then(util.unwrapHttpResponse);

  }

  function del(id) {
    return $http.delete('/cashboxes/' + id)
      .then(util.unwrapHttpResponse);
  }

  return service;
}
