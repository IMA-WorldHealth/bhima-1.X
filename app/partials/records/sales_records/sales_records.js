angular.module('kpk.controllers').controller('salesRecords', function($scope, $routeParams, validate) { 
  var defaultInvoice = ($routeParams.recordID || -1), dependencies = {}, defaultLimit = $scope.defaultLimit = 10;

  dependencies.sale = { 
    required: true,
    query: {
      tables: {
        sale: {columns: ['id', 'cost', 'currency_id', 'debitor_id', 'discount', 'invoice_date', 'posted']},
        patient: {columns: ['first_name', 'last_name']}
      },
      join: ['sale.debitor_id=patient.debitor_id'],
      limit: defaultLimit
    }
  };
  
  validate.process(dependencies).then(salesRecords);

  function salesRecords(model) { 
    //Expose data to template 
    $scope.model = model;
    if(defaultInvoice) $scope.select(defaultInvoice);
  }

  $scope.select = function(id) { $scope.selected = $scope.model.sale.get(id); }
});
