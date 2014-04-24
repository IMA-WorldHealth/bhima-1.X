angular.module('kpk.controllers')
.controller('purchaseOrderCash',
  [
  '$scope',
  '$routeParams',
  '$translate',
  '$http',
  'messenger',
  'validate',
  'appstate',
  function ($scope, $routeParams, $translate, $http, messenger, validate, appstate) {
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
    
    function payPurchase(purchaseId) {
      var purchase = { 
        project_id : appstate.get('project').id,
        type : 'E', // Entry ? I don't know
        date : getDate(),
        
      };

      $http.post('purchase', {details: 5});
    }
    
    function getDate() {
      //Format the current date according to RFC3339
      var currentDate = new Date();
      return currentDate.getFullYear() + "-" + (currentDate.getMonth() + 1) + "-" + ('0' + currentDate.getDate()).slice(-2);
    }
    $scope.confirmPurchase = confirmPurchase;
    $scope.payPurchase = payPurchase;
  }
]);
