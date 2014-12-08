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

      // FIXME: this code is never used
      // $scope.post = function() {
      //   var selected = $scope.selected;
      //   var request = [];
      //   if(selected) { request.push(selected.id); }

      //   connect.journal(request)
      //     .then(function(res) {
      //       if (res.status === 200) {
      //         invoicePosted(request);
      //       }
      //     });
      // };
    }

    // FIXME: this code is never used
    // $scope.select = function(id) {
    //   $scope.selected = $scope.purchase_model.get(id);
    // };

    // FIXME: this code is never used
    // function invoicePosted(ids) {
    //   var deferred = $q.defer();
    //   var promise_update = [];
    //   ids.forEach(function(invoice_id) {
    //     var current_invoice = $scope.invoice_model.get(invoice_id);
    //     console.log('Updating \'posted\'', invoice_id, current_invoice);
    //     current_invoice.posted = 1;
    //     promise_update.push(connect.basicPost('sale', [current_invoice], ['id']));
    //   });

    //   console.log(promise_update);
    //   $q.all(promise_update)
    //     .then(function(res) {
    //       console.log('All ids posted');
    //       deferred.resolve(res);
    //     });

    //   return deferred.promise;
    // }

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
            'columns' : ['uuid', 'reference', 'cost', 'discount', 'purchase_date', 'paid']
          },
          'creditor' : {
            'columns' : ['text']
          },
          'account' : {
            'columns' : ['id', 'account_number', 'account_txt']
          },
          'user' : {
            'columns' : ['first', 'last']
          }
        },
        join : [
          'purchase.creditor_uuid=creditor.uuid',
          'purchase.purchaser_id=user.id',
          'purchase.employee_id=account.id'
        ],
        where : ['purchase.is_direct=1']
      };
      
      var d = connect.req(direct);
      var i = connect.req(indirect);
      return $q.all([d,i]).then(function (result) { return result; });
    }

    init();

}]);