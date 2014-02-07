//TODO Debtor table currently has no personal information - this strictly ties debtors to patients (or some existing table) - a reverse lookup from debtor/ creditor ID to recipient is needed
angular.module('kpk.controllers').controller('invoice', function($scope, $routeParams, $q, validate, messenger) { 
  var dependencies = {}, origin = $scope.origin = $routeParams.originId, invoiceId = $routeParams.invoiceId, process = {}, timestamp = $scope.timestamp = new Date();
  if(!(origin && invoiceId)) throw new Error('Invalid parameters');
  
  process = { 
    'cash': processCash,
    'sale': processSale,
    'credit': processCredit,
    'debtor': processDebtor,
    'patient' : processPatient,
  };
  dependencies.recipient = { 
    required: true 
  };
  
  dependencies.invoice = {
    required: true,
    query: {
      tables: {},
      // where: [origin + '.id=' + invoiceId]
      where: ['sale.id=' + invoiceId]
    }
  };
 
  // dependencies.invoice.query.tables[origin] = {
  dependencies.invoice.query.tables['sale'] = {
    columns: ['id', 'cost', 'currency_id', 'debitor_id', 'seller_id', 'invoice_date', 'note']
  };
  
  //TODO sale_item hardcoded - have a map form originId to table name, item table name, recipient table name
  dependencies.invoiceItem = {
    required: true,
    query: {
      tables: {},
      join: ['sale_item.inventory_id=inventory.id'],
      where: ['sale_item.sale_id=' + invoiceId]
    }
  };

  dependencies.invoiceItem.query.tables['inventory'] = {
    columns: ['id', 'code', 'text']
  }

  dependencies.invoiceItem.query.tables['sale_item'] = { 
    columns: ['id', 'quantity', 'debit', 'credit']
  }

  dependencies.location = {
    required: false
  };

  dependencies.ledger = { 
    //required: true, // FIXME/TODO : why was this required? It breaks things on @jniles machine.
    identifier: 'inv_po_id'
  };
  
  process[origin](invoiceId);
  
  function processCash(requestId) { 
    dependencies.cash = { 
      required: true,
      query:  {
        tables: { 
          cash: { columns: ['id', 'date', 'cost', 'deb_cred_id', 'currency_id'] },
          cash_item: { columns: ['cash_id', 'allocated_cost', 'invoice_id'] }
        },
        join: ['cash_item.cash_id=cash.id'],
        where: ['cash_item.cash_id=' + requestId]
      }
    }

    validate.process(dependencies, ['cash']).then(buildInvoiceQuery);
  }

  function processSale() {  
    validate.process(dependencies, ['invoice', 'invoiceItem']).then(buildRecipientQuery);
  }
  
  //TODO this process is kind of a hack
  function processCredit(invoiceId) { 
    dependencies = {}; 
    dependencies.credit = { 
      required: true,
      query: { 
        tables: { 
          credit_note: { columns: ['id', 'cost', 'debitor_id', 'seller_id', 'sale_id', 'note_date', 'description'] },
          patient: { columns: ['first_name', 'last_name', 'current_location_id'] }
        },
        join: ['credit_note.debitor_id=patient.debitor_id'],
        where: ['credit_note.id=' + invoiceId]  
      }
    };
    validate.process(dependencies, ['credit']).then(buildCreditRecipient);
  }

  function processDebtor() { 
    messenger.danger('Method not implemented'); 
  }

  function processPatient() { 
    dependencies.recipient.query = { 
      tables: {},
      where: ['patient.id=' + invoiceId]
    }
    dependencies.recipient.query.tables['patient'] = { 
      columns: ['id', 'first_name', 'last_name', 'dob', 'current_location_id', 'debitor_id', 'registration_date']
    };
  
    validate.process(dependencies, ['recipient']).then(buildPatientLocation);
  }

  function buildPatientLocation(model) { 
    dependencies.location = { 
      required: true,
      query: '/location/' + model.recipient.data[0].location_id
    }
    
    validate.process(dependencies, ['location']).then(patientReceipt);
  }

  function buildInvoiceQuery(model) { 
    var cash_data = model.cash.data[0];
    dependencies.invoice.query.where = ["sale.id=" + cash_data.invoice_id];
    dependencies.invoiceItem.query.where = ["sale_item.sale_id=" + cash_data.invoice_id];
    processSale();
  }
  
  //TODO credit hack
  function buildCreditRecipient(model) { 
    dependencies.location = { 
      required: true,
      query: '/location/' + model.credit.data[0].location_id
    }

    validate.process(dependencies).then(creditInvoice);
  }
 
  function buildRecipientQuery(model) { 
    var invoice_data = model.invoice.data[0];
    
    dependencies.recipient.query = { 
      tables: {},
      where: ['patient.debitor_id=' + invoice_data.debitor_id]
    }
    dependencies.recipient.query.tables['patient'] = { 
      columns: ['first_name', 'last_name', 'dob', 'location_id']
    };

    dependencies.ledger.query = 'ledgers/debitor/' + invoice_data.debitor_id; 
    return validate.process(dependencies, ['recipient']).then(buildLocationQuery);
  }

  function buildLocationQuery(model) { 
    var recipient_data = model.recipient.data[0];

    dependencies.location.query = 'location/' + recipient_data.location_id;
    return validate.process(dependencies).then(invoice);
  }

  function invoice(model) { 
    
    //Expose data to template
    $scope.model = model;
    
    console.log(model);
    //Select invoice and recipient - validate should assert these only have one item
    $scope.invoice = $scope.model.invoice.data[0];
    $scope.invoice.ledger = $scope.model.ledger.get($scope.invoice.id);
    $scope.recipient = $scope.model.recipient.data[0];
    $scope.recipient.location = $scope.model.location.data[0];
   
    if(model.cash) $scope.cashTransaction  = $scope.model.cash.data[0];
  } 

  function patientReceipt(model) { $scope.model = model; $scope.recipient = $scope.model.recipient.data[0]; $scope.location = $scope.model.location.data[0]; }
  
  //TODO Follows the process credit hack
  function creditInvoice(model) { $scope.model = model; $scope.note = $scope.model.credit.data[0]; $scope.location = $scope.model.location.data[0]}
});
