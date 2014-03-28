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
  'uuid',
  function ($scope, $routeParams, $filter, $location, $timeout, validate, connect, appstate, messenger, uuid) {
    var invoiceId = $routeParams.invoiceId, dependencies = {};

    dependencies.sale = {
      required: true,
      query: {
        tables: {
          sale: {
            columns: ['uuid', 'cost', 'debitor_uuid', 'invoice_date', 'note', 'project_id']
          },
          patient: {
            columns: ['first_name', 'last_name']
          }
        },
        join: ['sale.debitor_uuid=patient.debitor_uuid']
      }
    };

    dependencies.saleItem = {
      required: true,
      query: {
        tables: {
          sale_item: {
            columns: ['uuid', 'inventory_uuid', 'quantity', 'transaction_price', 'debit', 'credit']
          },
          inventory: {
            columns: ['code', 'text']
          }
        },
        join: ['sale_item.inventory_uuid=inventory.uuid']
      }
    };

    dependencies.creditNote = {
      query: {
        tables: {
          'credit_note' : { columns: ['uuid', 'posted'] }
        }
      }
    };

    if(invoiceId) buildSaleQuery();

    function buildSaleQuery() {
      dependencies.sale.query.where = ['sale.uuid=' + invoiceId];
      dependencies.saleItem.query.where = ['sale_item.sale_uuid=' + invoiceId];
      dependencies.creditNote.query.where = ['credit_note.sale_uuid=' + invoiceId];
      return validate.process(dependencies).then(creditNote);
    }

    function creditNote(model) {
      $scope.model = model;
      $scope.sale = $scope.model.sale.data[0];
      $scope.creditNote = packageCreditNote();
    }

    function packageCreditNote() {
      var defaultDescription = "Credit matching transaction #" + $scope.sale.uuid + " from " + $filter('date')($scope.sale.invoice_date);
      var noteObject = {
        uuid : uuid(),
        project_id: $scope.sale.project_id,
        cost: $scope.sale.cost,
        debitor_uuid: $scope.sale.debitor_uuid,
        sale_uuid: $scope.sale.uuid,
        note_date: new Date().toISOString().slice(0, 10), // format as mysql date
        description: defaultDescription
      };
      return noteObject;
    }

    function submitNote(noteObject) {
      var insertId;
      //TODO Test object before submitting to server
      //TODO ?Check there are no credit notes for this transaction and warn user
   
      // connect.fetch('reports/saleRecords/?' + JSON.stringify({span: 'week'}))
      // .then(function (result) {
      //   console.log('result', result);
      // });
   
      if($scope.model.creditNote.data.length >= 1) return messenger.danger("Invoice has already been reversed with credit");
      connect.basicPut('credit_note', [noteObject])
      .then(function (creditResult) {
        return connect.fetch('journal/credit_note/' + noteObject.uuid);
      })
      .then(function (postResult) {
        $location.path('/invoice/credit/' + noteObject.uuid);
      }, function(error) {
        messenger.danger('submission failed ' + error.status);
      });

      validate.refresh(dependencies, ['creditNote']);
    }
 
    $scope.submitNote = submitNote;
  }
]);
