angular.module('bhima.controllers')
.controller('receipt.caution', [
  '$scope',
  'validate',
  'appstate',
  'messenger',
  function ($scope, validate, appstate, messenger) {
    var dependencies = {}, model = $scope.model = {common : {}}, utility = $scope.utility = {};

    dependencies.caution = {
      required: true,
      query:  {
        tables: {
          cash: { columns: ['reference', 'cost', 'deb_cred_uuid', 'project_id', 'currency_id', 'date'] },
          patient : {columns : ['first_name', 'last_name', 'current_location_id']}
        },
        join : ['cash.deb_cred_uuid=patient.debitor_uuid']
      }
    };

    function buildInvoice (res) {
      model.caution = res.caution.data[0];
    }

  	appstate.register('receipts.commonData', function (commonData) {
  		commonData.then(function (values) {
        model.common.location = values.location.data.pop();
        model.common.InvoiceId = values.invoiceId;
        utility.convert = values.convert;
        dependencies.caution.query.where = ['cash.uuid=' + values.invoiceId];
        validate.process(dependencies)
        .then(buildInvoice)
        .catch(function (err){
          messenger.danger('error', err);
        });
  		});
    });
  }
]);
