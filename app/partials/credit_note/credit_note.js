//TODO Ensure sale exists (validation test implementation required)
angular.module('kpk.controllers').controller('creditNote', function($scope, $routeParams, $filter, validate, connect, appstate) { 
  var invoiceId = $routeParams.invoiceId, dependencies = {};

  dependencies.sale = { 
    required: true, 
    query: { 
      tables: { 
        sale: { 
          columns: ['id', 'cost', 'debitor_id', 'invoice_date', 'note'] 
        },
        patient: { 
          columns: ['first_name', 'last_name']
        }
      },
      join: ['sale.debitor_id=patient.debitor_id']
    }
  }

  dependencies.saleItem = { 
    required: true, 
    query: { 
      tables: { 
        sale_item: { 
          columns: ['id', 'inventory_id', 'quantity', 'unit_price', 'total']
        },
        inventory: { 
          columns: ['code', 'text']
        }
      },
      join: ['sale_item.inventory_id=inventory.id']
    }
  }
  
  if(invoiceId) buildSaleQuery();

  function buildSaleQuery() { 
    dependencies.sale.query.where = ['sale.id=' + invoiceId]; 
    dependencies.saleItem.query.where = ['sale_item.sale_id=' + invoiceId];
    return validate.process(dependencies).then(creditNote);
  }

  function creditNote(model) {
    console.log(model);
    $scope.model = model;
    $scope.sale = $scope.model.sale.data[0];
    $scope.creditNote = packageCreditNote();
  }

  function packageCreditNote() { 
    var defaultDescription = "Credit matching transaction #" + $scope.sale.id + " from " + $filter('date')($scope.sale.invoice_date);
    var noteObject = { 
      enterprise_id: appstate.get('enterprise').id,
      cost: $scope.sale.cost,
      debitor_id: $scope.sale.debitor_id,
      sale_id: $scope.sale.id,
      note_date: new Date(),
      description: defaultDescription
    }
    return noteObject;
  }

  function submitNote(noteObject) { 
    //test object before submitting to server
      
    connect.basicPut('credit_note', [noteObject])
    .then(function(res) { 
      //$location.path('/invoice/');
    });
  }

  $scope.submitNote = submitNote;
});
