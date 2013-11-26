angular.module('kpk.controllers').controller('salesRecordsController', function($scope, $q, $routeParams, connect) { 
    console.log("Sale records initialised");

    var default_invoice = ($routeParams.recordID || -1);
    console.log("Got invoice", default_invoice);

    var user_request = connect.basicGet("user_session");


    function init() {

      $scope.selected = null;

      $q.all([fetchRecords(), user_request])
        .then(function(res) {
    //          expose scope
          console.log('debug', res[0], res[1])
          $scope.invoice_model = res[0];
          console.log("invoice_model", $scope.invoice_model);
          $scope.posting_user = res[1].data.id;
//          select default
          if(default_invoice>0) $scope.select(default_invoice);
        });
    }

    $scope.select = function(id) {
      console.log($scope.invoice_model);
      $scope.selected = $scope.invoice_model.get(id);
      console.log('selected', $scope.selected);
    }

    /*$scope.post = function() {
      console.log("Request for post");
      var INVOICE_TRANSACTION = 2;
//        This could be an arry
      var selected = $scope.selected;
      var request = [];
      *//* support multiple rows selected
       if(selected.length>0) {
       selected.forEach(function(item) {
       if(item.posted==0) {
       request.push(item.id);
       }
       });
       }*//*
//      FIXME 2 is transaction ID for sales - hardcoded probably isn't the best way
      if(selected) request.push({id: selected.id, transaction_type: INVOICE_TRANSACTION, user: $scope.posting_user});

      connect.journal(request)
        .then(function(res) {
          console.log(res);
//            returns a promise
          // TODO error handling
          if(res.status==200) invoicePosted(request);
        });

      console.log("request should be made for", request);
    }

    function invoicePosted(ids) {
      *//*summary
      *   Updates all affected records
      *//*
      console.log('ids', ids);
      ids.forEach(function(invoice_id) {
        console.log($scope.invoice_model);
        console.log(invoice_id);
        console.log($scope.invoice_model.get(invoice_id.id));
        $scope.invoice_model.get(invoice_id.id).posted = true;
      });
    }*/

    function fetchRecords() { 
      var deferred = $q.defer();

      $scope.selected = {};

      connect.req({'tables' : {'sale' : {'columns' : ['id', 'cost', 'currency_id', 'debitor_id', 'discount', 'invoice_date', 'posted']}}})
      .then(function(model) { 
        deferred.resolve(model);
      });

      return deferred.promise;
    }


    init();
  });