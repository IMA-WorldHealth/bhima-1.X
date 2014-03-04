//TODO Ensure sale exists (validation test implementation required)
angular.module('kpk.controllers')
.controller('creditNote', [
  '$scope',
  '$routeParams',
  '$filter',
  '$location',
  '$timeout',
  'validate',
  'connect',
  'appstate',
  'messenger',
  function ($scope, $routeParams, $filter, $location, $timeout, validate, connect, appstate, messenger) {
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
    };

    dependencies.saleItem = {
      required: true,
      query: {
        tables: {
          sale_item: {
            columns: ['id', 'inventory_id', 'quantity', 'transaction_price', 'debit', 'credit']
          },
          inventory: {
            columns: ['code', 'text']
          }
        },
        join: ['sale_item.inventory_id=inventory.id']
      }
    };
  
    if(invoiceId) buildSaleQuery();

    function buildSaleQuery() {
      dependencies.sale.query.where = ['sale.id=' + invoiceId];
      dependencies.saleItem.query.where = ['sale_item.sale_id=' + invoiceId];
      return validate.process(dependencies).then(creditNote);
    }

    function creditNote(model) {
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
        note_date: new Date().toISOString().slice(0, 10), // format as mysql date
        description: defaultDescription
      };
      return noteObject;
    }

    function submitNote(noteObject) {
      var insertId;
      //TODO Test object before submitting to server
      //TODO ?Check there are no credit notes for this transaction and warn user
      connect.basicPut('credit_note', [noteObject])
      .then(function (creditResult) {
        insertId = creditResult.data.insertId;
        
        return connect.basicGet('journal/credit_note/' + insertId);
      })
      .then(function (postResult) { 
        
        $location.path('/invoice/credit/' + insertId);
      }, function(error) { 
        messenger.danger('submission failed ' + error.status);
      });
    }
    
    $scope.submitNote = submitNote;
  }
]);
