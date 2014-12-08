angular.module('bhima.controllers')
.controller('purchaseConfirm', [
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
    var dependencies = {}, session = $scope.session = { purchase_type : 'indirect' };

    dependencies.indirect_purchase = {
      query : {
        identifier : 'uuid',
        tables : {
          purchase : { columns : ['uuid', 'reference', 'cost', 'creditor_uuid', 'employee_id', 'project_id', 'purchase_date', 'note', 'paid_uuid'] },
          employee : { columns : ['name'] },
          project : { columns : ['abbr'] }
        },
        join : ['purchase.project_id=project.id', 'purchase.employee_id=employee.id'],
        where : ['purchase.paid=1', 'AND' ,'purchase.confirmed=' + 0, 'AND', 'purchase.is_direct=0']
      }
    };

    dependencies.direct_purchase = {
      query : {
        identifier : 'uuid',
        tables : {
          purchase : { columns : ['uuid', 'reference', 'cost', 'creditor_uuid', 'employee_id', 'project_id', 'purchase_date', 'note', 'is_direct'] },
          account : { columns : ['id', 'account_number', 'account_txt'] },
          project : { columns : ['abbr'] }
        },
        join : ['purchase.project_id=project.id', 'purchase.employee_id=account.id'],
        where : ['purchase.confirmed=' + 0, 'AND', 'purchase.is_direct=1']
      }
    };

    dependencies.enterprise = {
      query : {
        tables : {
          enterprise : {columns : ['id', 'currency_id']}
        }
      }
    };

    appstate.register('project', function (project){
      $scope.project = project;
       validate.process(dependencies)
      .then(initialise);
    });

    function initialise(model) {
      angular.extend($scope, model);
    }

    $scope.confirmPurchase = function confirmPurchase(purchaseId) {
      session.selected = (session.purchase_type === 'direct') ? $scope.direct_purchase.get(purchaseId) : $scope.indirect_purchase.get(purchaseId);
    };

    $scope.confirmPayment = function confirmPayment () {
    	writeToJournal()
      .then(updatePurchase)
    	.then(generateDocument)
    	.catch(handleError);
    };

    function updatePurchase () {
    	var purchase = {
        	uuid : session.selected.uuid,
        	confirmed : 1
      };
      return connect.basicPost('purchase', [purchase], ['uuid']);
    }

    function writeToJournal () {
    	return (session.purchase_type === 'direct') ? connect.fetch('/journal/confirm_direct_purchase/' + session.selected.uuid) : connect.fetch('/journal/confirm/' + session.selected.paid_uuid);
    }

    function paymentSuccess(result) {
      var purchase = {
        uuid : session.selected.uuid,
        paid : 1
      };
      return connect.basicPost('purchase', [purchase], ['uuid']);
    }

    function generateDocument(res) {
      switch(session.purchase_type) {
        case 'direct':
          $location.path('/invoice/confirm_direct_purchase/' + session.selected.uuid);
        break;

        default:
          $location.path('/invoice/confirm_purchase/' + session.selected.uuid);
        break;
      }
    }

    function handleError(error) {
      throw error;
    }

    function getDate() {
      var currentDate = new Date();
      return currentDate.getFullYear() + '-' + (currentDate.getMonth() + 1) + '-' + ('0' + currentDate.getDate()).slice(-2);
    }

    $scope.resetSelected = function () {
      delete session.selected;
    };
  }
]);

