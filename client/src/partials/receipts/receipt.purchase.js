angular.module('bhima.controllers')
.controller('receipt.purchase', [
  '$scope',
  'validate',
  'appstate',
  'messenger',
  function ($scope, validate, appstate, messenger) {
    var dependencies = {}, model = $scope.model = {common : {}};

    dependencies.purchase = {
      query : {
        identifier : 'uuid',
        tables : {
          'purchase' : {
            columns : ['uuid', 'reference', 'project_id', 'cost', 'currency_id', 'creditor_uuid', 'purchase_date', 'note', 'employee_id']
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
            columns : ['location_id', 'email', 'fax', 'note', 'phone', 'international']
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
          'purchase.employee_id=employee.id'
        ]
      }
    };

    function buildInvoice (res) {
      model.purchases = res.purchase.data;
    }

  	appstate.register('receipts.commonData', function (commonData) {
  		commonData.then(function (values) {
        model.common.location = values.location.data.pop();
        model.common.InvoiceId = values.invoiceId;
        model.common.enterprise = values.enterprise.data.pop();
        dependencies.purchase.query.where =  ['purchase_item.purchase_uuid=' + values.invoiceId];
        validate.process(dependencies)
        .then(buildInvoice)
        .catch(function (err){
          messenger.danger('error', err);
        });
  		});     
    });    
  }
]);