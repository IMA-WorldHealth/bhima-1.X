angular.module('bhima.controllers')
.controller('purchaseRecords', [
  '$scope',
  '$q',
  '$routeParams',
  'connect',
  function ($scope, $q, $routeParams, connect) {

    var default_purchase = ($routeParams.purchaseID || -1);
    $scope.purchase_filter = {};

    function init() {
      $scope.selected = null;
      var promise = fetchRecords();
      promise
        .then(function(model) {
          $scope.purchase_model = model;
          //if (default_purchase > 0) { $scope.select(default_purchase); }

        });

      $scope.post = function() {
        var selected = $scope.selected;
        var request = [];
        if(selected) { request.push(selected.id); }

        connect.journal(request)
          .then(function(res) {
            console.log(res);
            if (res.status === 200) {
              invoicePosted(request);
            }
          });
      };
    }

    $scope.select = function(id) {
      $scope.selected = $scope.purchase_model.get(id);
    };

    function invoicePosted(ids) {
      var deferred = $q.defer();
      var promise_update = [];
      ids.forEach(function(invoice_id) {
        var current_invoice = $scope.invoice_model.get(invoice_id);
        console.log('Updating \'posted\'', invoice_id, current_invoice);
        current_invoice.posted = 1;
        promise_update.push(connect.basicPost('sale', [current_invoice], ['id']));
      });

      console.log(promise_update);
      $q.all(promise_update)
        .then(function(res) {
          console.log('All ids posted');
          deferred.resolve(res);
        });

      return deferred.promise;
    }

    function fetchRecords() {
      var deferred = $q.defer();
      $scope.selected = {};
      var requette = {
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
        'purchase.employee_id=employee.id']
      }
      connect.req(requette)
        .then(function(model) {
          console.log('voici notre model ', model)
          deferred.resolve(model);
        });
      return deferred.promise;
    }

    init();
  }
]);
