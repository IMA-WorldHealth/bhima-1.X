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
          purchase : { columns : ['uuid', 'reference', 'cost', 'creditor_uuid', 'employee_id', 'project_id', 'purchase_date', 'note'] },
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

      
      dependencies.employee = {
        query : {
          tables : {
            employee : {
              columns : ['creditor_uuid']
            }
          },
          where : ['employee.id=' + session.selected.employee_id]
        }
      };

      validate.process(dependencies, ['employee']).then(submitPayment);
    }

    function submitPayment(model) {
      var creditorId = model.employee.data[0].creditor_uuid;
      var purchase = {
        project_id : appstate.get('project').id,
        type : 'S', // Exit ? I don't know
        date : getDate(),
        deb_cred_uuid : creditorId,
        deb_cred_type : 'C', //?
        currency_id : 2, //FIXME
        value : session.selected.cost,
        description : 'PP/' + session.selected.uuid + '/',
        istransfer : 0 //FIXME remove from schema
      };

      $http.post('purchase', purchase);
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
