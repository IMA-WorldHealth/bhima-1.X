angular.module('bhima.controllers')
.controller('purchaseRecords', [
  '$scope',
  '$q',
  'connect',
  function ($scope, $q, connect) {
    var session = $scope.session = { purchase_type: 'indirect'};
    $scope.purchase_filter = {};

    function init() {
      $scope.selected = null;
      var promise = fetchRecords();

      promise.then(function(model) {
        $scope.indirect_purchase = model[1];
        $scope.direct_purchase = model[0];
      });
    }

    function fetchRecords() {
      $scope.selected = {};
      var indirect = {
        'tables' : {
          'purchase' : {
            'columns' : ['uuid', 'reference', 'cost', 'discount', 'purchase_date', 'paid']
          },
          'creditor' : {
            'columns' : ['text']
          },
          'employee' : {
            'columns' : ['name', 'prenom']
          },
          'user' : {
            'columns' : ['first', 'last']
          }
        },
        join : [
          'purchase.creditor_uuid=creditor.uuid',
          'purchase.purchaser_id=user.id',
          'purchase.employee_id=employee.id'
        ],
        where : ['purchase.is_direct=0']
      };

      var direct = {
        'tables' : {
          'purchase' : {
            'columns' : ['uuid', 'reference', 'cost', 'discount', 'purchase_date', 'confirmed']
          },
          'creditor' : {
            'columns' : ['text']
          },
          'supplier' : {
            'columns' : ['name']
          },
          'user' : {
            'columns' : ['first', 'last']
          }
        },
        join : [
          'purchase.creditor_uuid=creditor.uuid',
          'purchase.purchaser_id=user.id',
          'creditor.uuid=supplier.creditor_uuid'
        ],
        where : ['purchase.is_direct=1']
      };
      
      var d = connect.req(direct);
      var i = connect.req(indirect);
      return $q.all([d,i]);
    }

    init();

}]);