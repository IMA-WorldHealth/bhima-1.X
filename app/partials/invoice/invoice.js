//TODO Debtor table currently has no personal information - this strictly ties debtors to patients (or some existing table) - a reverse lookup from debtor/ creditor ID to recipient is needed
angular.module('kpk.controllers').controller('invoice', function($scope, $routeParams, $q, validate) { 
  var dependencies = {}, origin = $routeParams.originId, invoiceId = $routeParams.invoiceId;
  if(!(origin && invoiceId)) throw new Error('Invalid parameters');

  dependencies.recipient = { 
    required: true 
  };
  
  dependencies.invoice = { 
    required: true,
    query: { 
      tables: {},
      where: [origin + '.id=' + invoiceId]
    }
  };
  dependencies.invoice.query.tables[origin] = {
    columns: ['id', 'cost', 'currency_id', 'debitor_id', 'seller_id', 'invoice_date', 'note']
  };
  
  //TODO sale_item hardcoded - have a map form originId to table name, item table name, recipient table name
  dependencies.invoiceItem = {
    required: true,
    query: {
      tables: {},
      where: ['sale_item.sale_id=' + invoiceId]
    }
  };
  dependencies.invoiceItem.query.tables['sale_item'] = { 
    columns: ['id', 'quantity', 'unit_price', 'total']
  }
 
  validate.process(dependencies, ['invoice', 'invoiceItem']).then(updateDependencies);
   
  function updateDependencies(model) { 
    var invoice_data = model.invoice.data[0];
    
    dependencies.recipient.query = { 
      tables: {},
      where: ['patient.debitor_id=' + invoice_data.debitor_id]
    }
    dependencies.recipient.query.tables['patient'] = { 
      columns: ['first_name', 'last_name', 'dob', 'location_id']
    };
    return validate.process(dependencies).then(invoice);
  }

  function invoice(model) { 
    
    //Expose data to template
    $scope.model = model; 
    
    //Select invoice and recipient - validate should assert these only have one item
    $scope.invoice = $scope.model.invoice.data[0];
    $scope.recipient = $scope.model.recipient.data[0];
    console.log($scope.invoice, $scope.recipient);
  }
});
