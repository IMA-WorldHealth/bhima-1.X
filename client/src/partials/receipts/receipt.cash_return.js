angular.module('bhima.controllers')
.controller('receipt.cash_return', [
  '$scope',
  'validate',
  'appstate',
  'messenger',
  function ($scope, validate, appstate, messenger) {
    var dependencies = {}, model = $scope.model = {common : {}}; 

    dependencies.cash_return = {
      required: true,
      query: {
        tables: {
          primary_cash      : { columns: ['reference', 'uuid', 'date', 'deb_cred_uuid', 'deb_cred_type', 'currency_id', 'account_id', 'cost', 'user_id', 'description', 'cash_box_id'] },
          primary_cash_item : { columns: ['document_uuid'] }
        },
        join: ['primary_cash.uuid=primary_cash_item.primary_cash_uuid']
      }
    };

    function buildInvoice (res) {
      model.cash_return = res.cash_return.data.pop();

      return buildInfo();
    }

    function buildInfo () {
      // Get correct recipient
      if (model.cash_return.deb_cred_type === 'C') {
        dependencies.recipient = {
          query: {
            tables: {
              creditor      : { columns: ['text'] }
            },
            where : ['creditor.uuid=' + model.cash_return.deb_cred_uuid]
          }
        };
      } else if (model.cash_return.deb_cred_type === 'D') {
        dependencies.recipient = {
          query: {
            tables: {
              debitor      : { columns: ['text'] }
            },
            where : ['debitor.uuid=' + model.cash_return.deb_cred_uuid]
          }
        };
      }

      dependencies.user = {
        query: {
          tables: {
            user : { columns: ['first', 'last'] }
          },
          where : ['user.id=' + model.cash_return.user_id]
        }
      };

      validate.process(dependencies, ['recipient', 'user'])
      .then(function (res) {
        model.recipient = res.recipient.data.length > 0 ? res.recipient.data[0] : {};
        model.user = res.user.data.length > 0 ? res.user.data[0] : {};
      });
    }

    appstate.register('receipts.commonData', function (commonData) {
      commonData.then(function (values) {
        model.common.location = values.location.data.pop();
        model.common.invoiceId = values.invoiceId;
        model.common.enterprise = values.enterprise.data.pop();
        dependencies.cash_return.query.where = ['primary_cash.uuid=' + values.invoiceId];
        validate.process(dependencies)
        .then(buildInvoice)
        .catch(function (err){
          messenger.danger('error', err);
        });
      });     
    });    
  }
]);