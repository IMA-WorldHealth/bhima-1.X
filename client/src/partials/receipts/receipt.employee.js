angular.module('bhima.controllers')
.controller('receipt.employee', [
  '$scope',
  'validate',
  'appstate',
  'messenger',
  function ($scope, validate, appstate, messenger) {
    var dependencies = {}, model = $scope.model = {common : {}};

    dependencies.employee = {
      required: true,
      query:  {
        tables: {
          primary_cash: { columns: ['reference', 'cost', 'project_id', 'currency_id', 'date'] },
          primary_cash_item : {columns : ['debit', 'credit']},
          account : {columns : ['account_txt']},
          employee : { columns: ['name', 'postnom', 'prenom', 'creditor_uuid'] },
          sale       : {columns : ['note']}
        },
        join : [
          'primary_cash.account_id=account.id', 
          'primary_cash.uuid=primary_cash_item.primary_cash_uuid', 
          'sale.uuid=primary_cash_item.inv_po_id', 
          'employee.creditor_uuid=primary_cash.deb_cred_uuid'
        ]
      }
    };

    function buildInvoice (res) {
      model.employee = res.employee.data;
    }

  	appstate.register('receipts.commonData', function (commonData) {
  		commonData.then(function (values) {
        model.common.location = values.location.data.pop();
        model.common.InvoiceId = values.invoiceId;
        model.common.enterprise = values.enterprise.data.pop();
        dependencies.employee.query.where = ['primary_cash.uuid=' + values.invoiceId];
        validate.process(dependencies)
        .then(buildInvoice)
        .catch(function (err){
          messenger.danger('error', err);
        });
  		});     
    });    
  }
]);