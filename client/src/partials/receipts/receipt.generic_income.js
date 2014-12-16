angular.module('bhima.controllers')
.controller('receipt.generic_income', [
  '$scope',
  'validate',
  'appstate',
  'messenger',
  function ($scope, validate, appstate, messenger) {
    var dependencies = {}, model = $scope.model = {common : {}};    

    dependencies.genericIncome = {
      query : {
        identifier : 'uuid',
        tables : {
          primary_cash : { columns : ['reference', 'description', 'cost', 'currency_id', 'date'] },
          primary_cash_item : { columns : ['document_uuid'] },
          user : { columns : ['first', 'last'] },
          account : { columns : ['account_txt'] }
        },
        join : ['primary_cash.user_id=user.id', 'primary_cash.account_id=account.id', 'primary_cash.uuid=primary_cash_item.primary_cash_uuid']
      }
    };

    function buildInvoice (res) {
      model.genericIncome = res.genericIncome.data.pop();
    }

  	appstate.register('receipts.commonData', function (commonData) {
  		commonData.then(function (values) {
        model.common.location = values.location.data.pop();
        model.common.InvoiceId = values.invoiceId;
        model.common.enterprise = values.enterprise.data.pop();
        dependencies.genericIncome.query.where = ['primary_cash.uuid=' + values.invoiceId];
        validate.process(dependencies)
        .then(buildInvoice)
        .catch(function (err){
          messenger.danger('error', err);
        });
  		});     
    });    
  }
]);