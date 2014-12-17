angular.module('bhima.controllers')
.controller('receipt.transfer', [
  '$scope',
  'validate',
  'appstate',
  'messenger',
  function ($scope, validate, appstate, messenger) {
    var dependencies = {}, model = $scope.model = {common : {}};

    dependencies.transfer = {
      required: true,
      query:  {
        tables: {
          primary_cash: { columns: ['cost', 'project_id', 'currency_id', 'date'] },
          user : {columns : ['first', 'last']},
          account : {columns : ['account_txt']}
        },
        join : ['primary_cash.user_id=user.id', 'primary_cash.account_id=account.id']
      }
    };

    function buildInvoice (res) {
      model.transfer = res.transfer.data.pop();
    }

  	appstate.register('receipts.commonData', function (commonData) {
  		commonData.then(function (values) {
        model.common.location = values.location.data.pop();        
        model.common.enterprise = values.enterprise.data.pop();
        model.common.InvoiceId = values.invoiceId;
        dependencies.transfer.query.where = ['primary_cash.uuid=' + values.invoiceId];
        validate.process(dependencies)
        .then(buildInvoice)
        .catch(function (err){
          messenger.danger('error', err);
        });
  		});     
    });    
  }
]);