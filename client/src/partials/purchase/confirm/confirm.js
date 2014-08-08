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
    var dependencies = {}, session = $scope.session = {};

    dependencies.purchase = {
      query : {
        identifier : 'uuid',
        tables : {
          purchase : { columns : ['uuid', 'reference', 'cost', 'creditor_uuid', 'employee_id', 'project_id', 'purchase_date', 'note', 'paid_uuid'] },
          employee : { columns : ['name'] },
          project : { columns : ['abbr'] }
        },
        join : ['purchase.project_id=project.id', 'purchase.employee_id=employee.id'],
        where : ['purchase.paid=' + 1, 'AND' ,'purchase.confirmed=' + 0]
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
       validate.process(dependencies).then(initialise);
    });

    function initialise(model) {
      angular.extend($scope, model);
    }

    function confirmPurchase(purchaseId) {
      session.selected = $scope.purchase.get(purchaseId);
    }

    function confirmPayment () {
    	updatePurchase()
    	.then(writeToJournal)
    	.then(generateDocument)
    	.catch(handleError);
    }

    function updatePurchase () {
    	var purchase = {
        	uuid : session.selected.uuid,
        	confirmed : 1
      };
      return connect.basicPost('purchase', [purchase], ['uuid']);
    }

    function writeToJournal () {
    	return connect.fetch('/journal/confirm/' + session.selected.paid_uuid);
    }

    function paymentSuccess(result) {
      var purchase = {
        uuid : session.selected.uuid,
        paid : 1
      };
      return connect.basicPost('purchase', [purchase], ['uuid']);
    }

    function generateDocument (res){
       $location.path('/invoice/confirm_purchase/' + session.selected.uuid);
    }

    function handleError(error) {
      throw error;
    }

    function getDate() {
      var currentDate = new Date();
      return currentDate.getFullYear() + '-' + (currentDate.getMonth() + 1) + '-' + ('0' + currentDate.getDate()).slice(-2);
    }
    $scope.confirmPurchase = confirmPurchase;
    $scope.confirmPayment = confirmPayment;
  }
]);

