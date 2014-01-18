angular.module('kpk.controllers').controller('invoice', function($scope, $routeParams, $q, validate) { 
  console.log('invoice');
  
  var dependencies = {}, origin = $routeParams.origin, invoiceId = $routeParams.invoiceId;
  
  dependencies.patient = { 
    required: true
  };

  dependencies.sale = { 
    required: true
    //...
  };

  dependencies.saleItem = {
    required: true
  };
  
  function invoice(model) { 
    
    //Expose to template
    $scope.model = model; 
  }

});
