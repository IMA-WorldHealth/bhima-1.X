angular.module('bhima.controllers')
.controller('receipt.confirm_integration', [
  '$scope',
  'validate',
  'appstate',
  'messenger',
  function ($scope, validate, appstate, messenger) {
    var dependencies = {}, model = $scope.model = {common : {}};

    dependencies.stock = {
      query : {
        identifier : 'uuid',
        tables : {
          purchase : { columns : ['purchaser_id', 'purchase_date', 'emitter_id'] },
          movement : {
            columns : ['uuid', 'document_id', 'depot_entry', 'tracking_number', 'quantity', 'date']
          },
          stock : {
            columns : ['expiration_date', 'entry_date', 'lot_number', 'purchase_order_uuid']
          },
          inventory : {
            columns : ['code', 'text::inventory_text']
          },
          depot : {
            columns : ['reference', 'text']
          }
        },
        join : [
          'movement.depot_entry=depot.uuid',
          'movement.tracking_number=stock.tracking_number',
          'stock.inventory_uuid=inventory.uuid',
          'stock.purchase_order_uuid=purchase.uuid'
        ]
      }
    };

    dependencies.user = {
      query : 'user_session'
    };

    dependencies.allUser = {
      identifier : 'id',
      query : {
        tables : {
          user : {columns : ['id', 'first', 'last']}
        }
      }
    };

    function buildInvoice (res) {
      model.stock = res.stock.data;
      $scope.idUser = res.user.data.id;
      $scope.today = new Date();
      return res;
    }

    function getUsers (data) {
      var p = data.allUser.get(data.stock.data[0].emitter_id);
      var c = data.allUser.get(data.user.data.id);
      model.integreur = p.first + ' - ' + p.last;
      model.confirmeur = c.first + ' - ' + c.last;
    }

  	appstate.register('receipts.commonData', function (commonData) {
  		commonData.then(function (values) {

        model.common.location = values.location.data.pop();
        model.common.InvoiceId = values.invoiceId;
        model.common.enterprise = values.enterprise.data.pop();
        dependencies.stock.query.where =  ['movement.document_id=' + values.invoiceId];

        validate.process(dependencies)
        .then(buildInvoice)
        .then(getUsers)
        .catch(function (err){
          messenger.danger('error', err);
        });
  		});
    });
  }
]);
