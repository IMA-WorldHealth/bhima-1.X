angular.module('kpk.controllers').controller('creditNote', function($scope, $routeParams, validate) { 
  var invoiceId = $routeParams.invoiceId; 
  var dependencies = {};
  dependencies.sale = { 
    required: true, 
    query: { 
      tables: { 
        sale: { 
          columns: ['id', 'cost', 'debitor_id', 'invoice_date', 'note'] 
        }
      }
    }
  }
  
  if(invoiceId) buildSaleQuery();

  function buildSaleQuery() { 
    dependencies.sale.query.where = ['sale.id=' + invoiceId]; 
    return validate.process(dependencies).then(creditNote);
  }

  function creditNote(model) { 
    $scope.model = model;
  
    
    console.log('fetched', model);
  }
});
