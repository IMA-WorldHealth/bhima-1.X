angular.module('kpk.controllers')
.controller('salesRecords', [
  '$scope',
  '$routeParams',
  'validate',
  function($scope, $routeParams, validate) {
    //TODO Replace sale records with slick grid, indexable sortable data
    
    var defaultInvoice = ($routeParams.recordID || -1), dependencies = {}, defaultLimit = $scope.defaultLimit = 10;

    dependencies.sale = {
      required: true,
      query: {
        tables: {
          sale: {
            columns: ['id', 'cost', 'currency_id', 'debitor_id', 'discount', 'invoice_date', 'posted']
          },
          patient: {
            columns: ['first_name', 'last_name']
          }
        },
        join: ['sale.debitor_id=patient.debitor_id']
        // limit: defaultLimit
      }
    };
   

    function salesRecords(model) {
      //Expose data to template
      $scope.model = model;
      if(defaultInvoice) $scope.select(defaultInvoice);
    }

    validate.process(dependencies).then(salesRecords);
    $scope.select = function(id) { $scope.selected = $scope.model.sale.get(id); };
  }
]);
