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
        tables : {
          purchase : { columns : ['uuid', 'reference', 'cost', 'creditor_uuid', 'employee_id'] }
        }
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
      console.log($scope);
    }
  }
]);
