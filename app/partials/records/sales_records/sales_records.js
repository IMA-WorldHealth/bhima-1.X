angular.module('kpk.controllers')
.controller('salesRecords', [
  '$scope',
  '$routeParams',
  'validate',
  function($scope, $routeParams, validate) {
    //TODO Replace sale records with slick grid, indexable sortable data
    
    var defaultInvoice = ($routeParams.recordID || -1), dependencies = {}, defaultLimit = $scope.defaultLimit = 10;
    
    dependencies.sale = { 
      query: '/reports/saleRecords/?' + JSON.stringify({span: 'week'})
    };
   
    function salesRecords(model) {
      console.log('model', model);
      //Expose data to template
      $scope.model = model;
      if(defaultInvoice) $scope.select(defaultInvoice);
    }

    validate.process(dependencies).then(salesRecords);
    $scope.select = function(id) { $scope.selected = $scope.model.sale.get(id); };
  }
]);
