angular.module('bhima.controllers')
.controller('purchaseOrderCash', [
  '$scope',
  '$routeParams',
  '$translate',
  '$http',
  'messenger',
  'validate',
  'appstate',
  'connect',
  '$location',
  function ($scope, $routeParams, $translate, $http, messenger, validate, appstate, connect, $location) {
    var dependencies = {}, session = $scope.session = {};
    var cashbox, cashboxReference = $routeParams.cashbox;
    var currency_id = 2; // FIXME

    if (!cashboxReference) {
      return messenger.info($translate.instant('CASH_PURCHASE.CASHBOX_ASSIGN_ERROR'));
    }

    // TODO Don't download complete purchase orders
    dependencies.purchase = {
      query : {
        identifier : 'uuid',
        tables : {
          purchase : { columns : ['uuid', 'reference', 'cost', 'creditor_uuid', 'employee_id', 'project_id', 'purchase_date', 'note'] },
          employee : { columns : ['name'] },
          project : { columns : ['abbr'] }
        },
        join : ['purchase.project_id=project.id', 'purchase.employee_id=employee.id'],
        where : ['purchase.paid='+0]
      }
    };

    dependencies.cashbox = {
      query : {
        tables : {
          cash_box : { columns : ['id', 'text', 'project_id', 'is_auxillary'] },
          cash_box_account_currency : { columns : ['account_id'] },
        },
        join : ['cash_box_account_currency.cash_box_id=cash_box.id'],
        where : ['cash_box.id=' + cashboxReference, 'AND', 'cash_box_account_currency.currency_id=' + currency_id]
      }
    };

    dependencies.enterprise = {
      query : {
        tables : {
          enterprise : {columns : ['id', 'currency_id']}
        }
      }
    }

    dependencies.pcash_module = {
      required : true,
      query : {
        tables : {
          'primary_cash_module' : {
            columns : ['id']
          }
        },
        where : ['primary_cash_module.text=Purchase']
      }
    }

    appstate.register('project', function (project){
      $scope.project = project
       validate.process(dependencies).then(initialise)
    })



    function initialise(model) {
      angular.extend($scope, model);
      cashbox = $scope.cashbox = model.cashbox.data[0];
    }

    function confirmPurchase(purchaseId) {
      session.selected = $scope.purchase.get(purchaseId);

    }

    function payPurchase() {
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
      console.log('session', session, 'le model est ', model);
      var creditorId = model.employee.data[0].creditor_uuid;
      var request = {
        details : {
          project_id : appstate.get('project').id,
          type : 'S',
          date : getDate(),
          deb_cred_uuid : creditorId,
          deb_cred_type : 'C',
          currency_id : model.enterprise.data[0].currency_id, //FIXME
          cash_box_id : cashbox.id,
          account_id : cashbox.account_id,
          description : 'PP/' + session.selected.uuid + '/',
          origin_id : model.pcash_module.data[0].id
        },
        transaction : [
          {
            inv_po_id : session.selected.uuid,
            debit : session.selected.cost,
            credit : 0
          }
        ]
      };

      $http.post('purchase', request)
      .then(paymentSuccess)
      .then(generateDocument)
      .catch(handleError);
    }

    function paymentSuccess(result) {
      var purchase = {
        uuid : session.selected.uuid,
        paid : 1
      }
      return connect.basicPost('purchase', [purchase], ['uuid'])
    }

    function generateDocument (res){
       $location.path('/invoice/indirect_purchase/' + session.selected.uuid);
    }

    function handleError(error) {
      throw error;
    }

    function getDate() {
      //Format the current date according to RFC3339
      var currentDate = new Date();
      return currentDate.getFullYear() + '-' + (currentDate.getMonth() + 1) + '-' + ('0' + currentDate.getDate()).slice(-2);
    }
    $scope.confirmPurchase = confirmPurchase;
    $scope.payPurchase = payPurchase;
  }
]);
