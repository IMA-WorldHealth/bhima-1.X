angular.module('kpk.controllers')
.controller('purchaseOrderCash',
  [
  '$scope',
  '$routeParams',
  '$translate',
  'messenger',
  'validate',
  function ($scope, $routeParams, $translate, messenger, validate) {
    var dependencies = {}, session = $scope.session = {};
    var cashbox, cashboxReference = $routeParams.cashbox;
    
    if (!cashboxReference) return messenger.info($translate('CASH_PURCHASE.CASHBOX_ASSIGN_ERROR'));
    
    // TODO Don't download complete purchase orders
    dependencies.purchase = {
      query : {
        identifier : 'uuid',
        tables : {
          purchase : { columns : ['uuid', 'reference', 'cost', 'creditor_uuid', 'employee_id', 'project_id', 'invoice_date', 'note'] },
          employee : { columns : ['name'] },
          project : { columns : ['abbr'] }
        },
        join : ['purchase.project_id=project.id', 'purchase.employee_id=employee.id']
      }
    };

    dependencies.cashbox = {
      query : {
        tables : {
          cash_box : { columns : ['id', 'text', 'project_id', 'is_auxillary'] }
        },
        where : ['cash_box.id=' + cashboxReference]
      }
    };

    validate.process(dependencies).then(initialise);

    function initialise(model) {
      angular.extend($scope, model);
      cashbox = $scope.cashbox = model.cashbox.data[0];
      console.log(model);
    }

    function confirmPurchase(purchaseId) {
      session.selected = $scope.purchase.get(purchaseId);
    }

    function writeCash(uuid) {

    }

    function postCash(uuid) {

    }

    $scope.confirmPurchase = confirmPurchase;
  }
]);
