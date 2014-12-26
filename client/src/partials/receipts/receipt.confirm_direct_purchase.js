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
          supplier : { columns : ['name'] }
        },
        join : ['purchase.creditor_uuid=supplier.creditor_uuid']
      }
    };

    function buildInvoice (res) {
      model.confirmDirectPurchase = res.confirmDirectPurchase.data.pop();
    }

  	appstate.register('receipts.commonData', function (commonData) {
  		commonData.then(function (values) {
        model.common.location = values.location.data.pop();
        model.common.InvoiceId = values.invoiceId;
        model.common.enterprise = values.enterprise.data.pop();
        dependencies.confirmDirectPurchase.query.where =  ['purchase.uuid=' + values.invoiceId];
        validate.process(dependencies)
        .then(buildInvoice)
        .catch(function (err){
          messenger.danger('error', err);
        });
  		});     
    });    
  }
]);