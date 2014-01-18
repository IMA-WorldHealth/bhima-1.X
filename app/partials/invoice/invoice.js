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
    
    //If all has gone well (this should be asserted by validate) there is only one sale
    $scope.invoice = model.invoice.data[0];

    dependencies.recipient.query = { 
      tables: {},
      where: ['patient.debtor_id=' + $scope.invoice.debitor_id]
    }
    dependencies.recipient.query.tables['patient'] = { 
      columns: ['first_name', 'last_name', 'dob', 'location_id']
    };
    
    console.log(model);
    // return validate.process(dependencies).then(invoice);
  }

  function invoice(model) { 
 
    //Expose to template
    $scope.model = model; 
  }
});
