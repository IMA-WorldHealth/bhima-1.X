angular.module('bhima.controllers')
.controller('purchaseRecordsController', [
  '$scope',
  '$q',
  '$routeParams',
  'connect',
  function ($scope, $q, $routeParams, connect) {

    var default_purchase = ($routeParams.purchaseID || -1);

    function init() {

      $scope.selected = null;

      var promise = fetchRecords();
      promise
        .then(function(model) {
          //expose scope
          $scope.purchase_model = model;
          //Select default
          if(default_purchase>0) $scope.select(default_purchase);

        });

      $scope.post = function() {
        console.log("Request for post");
  //      This could be an arry
        var selected = $scope.selected;
        var request = [];
        /* support multiple rows selected
        if(selected.length>0) {
        selected.forEach(function(item) {
        if(item.posted==0) {
        request.push(item.id);
        }
        });
        }*/
        if(selected) request.push(selected.id);
        //if(selected) request.push({transact ion_id:1, service_id:1, user_id:1});

        connect.journal(request)
          .then(function(res) {
            console.log(res);
  //          returns a promise
            if(res.status==200) invoicePosted(request);
          });

        console.log("request should be made for", request);
      };
    }

    $scope.select = function(id) {
      $scope.selected = $scope.purchase_model.get(id);
      console.log('selected', $scope.selected);
    };

    function invoicePosted(ids) {
      var deferred = $q.defer();
      var promise_update = [];
      /*summary
      *   Updates all records in the database with posted flag set to true
      */
      ids.forEach(function(invoice_id) {
        var current_invoice = $scope.invoice_model.get(invoice_id);
        console.log("Updating 'posted'", invoice_id, current_invoice);
        current_invoice.posted = 1;
        promise_update.push(connect.basicPost("sale", [current_invoice], ["id"]));
      });

      console.log(promise_update);
      $q.all(promise_update)
        .then(function(res) {
          console.log("All ids posted");
          deferred.resolve(res);
        });

      return deferred.promise;
    }

    function fetchRecords() {
      var deferred = $q.defer();

      $scope.selected = {};

      connect.req({'tables' : {'purchase' : {'columns' : ['uuid', 'cost', 'currency_id', 'creditor_uuid', 'discount', 'purchase_date', 'paid']}}})
        .then(function(model) {
          deferred.resolve(model);
        });

      return deferred.promise;
    }

    init();
  }
]);
