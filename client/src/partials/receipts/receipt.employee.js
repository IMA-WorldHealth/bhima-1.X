angular.module('bhima.controllers')
.controller('receipt.employee', [
  '$scope',
  'validate',
  'appstate',
  'messenger',
  function ($scope, validate, appstate, messenger) {
    var dependencies = {}, model = $scope.model = {common : {}};

    dependencies.convention = {
      required: true,
      query:  {
        tables: {
          primary_cash: { columns: ['reference', 'cost', 'project_id', 'currency_id', 'date'] },
          primary_cash_item : {columns : ['debit', 'credit']},
          account : {columns : ['account_txt']},
          sale       : {columns : ['note']}
        },
        join : ['primary_cash.account_id=account.id', 'primary_cash.uuid=primary_cash_item.primary_cash_uuid', 'sale.uuid=primary_cash_item.inv_po_id']
      }
    };

    function buildInvoice (res) {
      model.conventions = res.convention.data;
    }

  	appstate.register('receipts.commonData', function (commonData) {
  		commonData.then(function (values) {
        model.common.location = values.location.data.pop();
        model.common.InvoiceId = values.invoiceId;
        model.common.enterprise = values.enterprise.data.pop();
        dependencies.convention.query.where = ['primary_cash.uuid=' + values.invoiceId];
        validate.process(dependencies)
        .then(buildInvoice)
        .catch(function (err){
          messenger.danger('error', err);
        });
  		});     
    });    
  }
]);