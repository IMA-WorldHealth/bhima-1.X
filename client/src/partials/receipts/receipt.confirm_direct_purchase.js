angular.module('bhima.controllers')
.controller('receipt.confirm_direct_purchase', [
  '$scope',
  'validate',
  'appstate',
  'messenger',
  function ($scope, validate, appstate, messenger) {
    var dependencies = {}, model = $scope.model = {common : {}};

    dependencies.confirmDirectPurchase = {
      query : {
        identifier : 'uuid',
        tables : {
          purchase : { columns : ['uuid', 'reference', 'cost', 'creditor_uuid', 'project_id', 'purchase_date', 'note'] },
          supplier : { columns : ['name'] },
          user : { columns : ['first', 'last'] }
        },
        join : [
          'purchase.creditor_uuid=supplier.creditor_uuid',
          'purchase.issuer_id=user.id']
      }
    };

    dependencies.directPurchases = {
      query : {
        identifier : 'uuid',
        tables : {
          'purchase' : {
            columns : ['uuid', 'reference', 'project_id', 'cost', 'currency_id', 'creditor_uuid', 'purchase_date', 'note', 'employee_id', 'is_direct']
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
          }
        },
        join : [
          'purchase.uuid=purchase_item.purchase_uuid',
          'purchase_item.inventory_uuid=inventory.uuid',
          'purchase.creditor_uuid=creditor.uuid',
          'creditor.uuid=supplier.creditor_uuid'
        ]
      }
    };

    function buildInvoice (res) {
      model.directPurchase = res.directPurchases.data;
      model.confirmDirectPurchase = res.confirmDirectPurchase.data.pop();
    }

  	appstate.register('receipts.commonData', function (commonData) {
  		commonData.then(function (values) {

        model.common.location = values.location.data.pop();
        model.common.InvoiceId = values.invoiceId;
        model.common.enterprise = values.enterprise.data.pop();
        dependencies.confirmDirectPurchase.query.where =  ['purchase.uuid=' + values.invoiceId];
        dependencies.directPurchases.query.where =  ['purchase.uuid=' + values.invoiceId];

        validate.process(dependencies)
        .then(buildInvoice)
        .catch(function (err){
          messenger.danger('error', err);
        });
  		});     
    });    
  }
]);