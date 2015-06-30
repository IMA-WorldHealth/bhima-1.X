angular.module('bhima.controllers')
.controller('receipt.confirm_indirect_purchase', [
  '$scope',
  'validate',
  'appstate',
  'messenger',
  function ($scope, validate, appstate, messenger) {
    var dependencies = {}, model = $scope.model = {common : {}};

    dependencies.confirmIndirectPurchase = {
      query : {
        identifier : 'uuid',
        tables : {
          purchase : { columns : ['uuid', 'reference', 'cost', 'creditor_uuid', 'purchaser_id', 'project_id', 'purchase_date', 'note'] },
          employee : { columns : ['code', 'name', 'prenom', 'postnom'] },
          user : { columns : ['first', 'last'] }
        },
        join : [
          'purchase.purchaser_id=employee.id',
          'purchase.emitter_id=user.id'
        ]
      }
    };

    dependencies.indirectPurchases = {
      query : {
        identifier : 'uuid',
        tables : {
          'purchase' : {
            columns : ['uuid', 'reference', 'project_id', 'cost', 'currency_id', 'creditor_uuid', 'purchase_date', 'note', 'purchaser_id', 'is_direct']
          },
          'purchase_item' : {
            columns : ['inventory_uuid', 'purchase_uuid', 'quantity', 'unit_price', 'total']
          },
          'inventory' : {
            columns : ['code', 'text']
          },
          'creditor' : {
            columns : ['group_uuid']
          },
          'supplier' : {
            columns : ['email', 'phone']
          },
          'employee' : {
            columns : ['prenom', 'name', 'postnom', 'creditor_uuid']
          }
        },
        join : [
          'purchase.uuid=purchase_item.purchase_uuid',
          'purchase_item.inventory_uuid=inventory.uuid',
          'purchase.creditor_uuid=creditor.uuid',
          'creditor.uuid=supplier.creditor_uuid',
          'purchase.purchaser_id=employee.id'
        ]
      }
    };

    function buildInvoice (res) {
      model.indirectPurchase = res.indirectPurchases.data;
      model.confirmIndirectPurchase = res.confirmIndirectPurchase.data.pop();
    }

  	appstate.register('receipts.commonData', function (commonData) {
  		commonData.then(function (values) {

        model.common.location = values.location.data.pop();
        model.common.InvoiceId = values.invoiceId;
        model.common.enterprise = values.enterprise.data.pop();

        dependencies.confirmIndirectPurchase.query.where =  ['purchase.uuid=' + values.invoiceId];
        dependencies.indirectPurchases.query.where =  ['purchase.uuid=' + values.invoiceId];

        validate.process(dependencies)
        .then(buildInvoice)
        .catch(function (err){
          messenger.danger('error', err);
        });
  		});
    });
  }
]);
