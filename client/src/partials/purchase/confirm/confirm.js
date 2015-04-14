angular.module('bhima.controllers')
.controller('purchaseConfirm', [
  '$scope',
  'validate',
  'appstate',
  'connect',
  '$location',
  function ($scope, validate, appstate, connect, $location) {
    var dependencies = {}, session = $scope.session = { is_direct : false };

    dependencies.indirect_purchase = {
      query : {
        identifier : 'uuid',
        tables : {
          purchase : { columns : ['uuid', 'reference', 'cost', 'creditor_uuid', 'employee_id', 'project_id', 'purchase_date', 'note', 'paid_uuid'] },
          employee : { columns : ['name'] },
          project : { columns : ['abbr'] }
        },
        join : ['purchase.project_id=project.id', 'purchase.employee_id=employee.id'],
        where : ['purchase.paid=1', 'AND' ,'purchase.confirmed=' + 0, 'AND', 'purchase.is_direct=0', 'AND', 'purchase.is_donation=0', 'AND', 'purchase.closed=1']
      }
    };

    dependencies.direct_purchase = {
      query : {
        identifier : 'uuid',
        tables : {
          purchase : { columns : ['uuid', 'reference', 'cost', 'creditor_uuid', 'employee_id', 'project_id', 'purchase_date', 'note', 'is_direct'] },
          supplier : { columns : ['name'] },
          project : { columns : ['abbr'] }
        },
        join : ['purchase.project_id=project.id', 'purchase.creditor_uuid=supplier.creditor_uuid'],
        where : ['purchase.confirmed=' + 0, 'AND', 'purchase.is_direct=1', 'AND', 'purchase.is_donation=0', 'AND', 'purchase.closed=1']
      }
    };

    dependencies.user = {
      query : 'user_session'
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
      $scope.idUser = model.user.data.id;
      angular.extend($scope, model);
    }

    $scope.confirmPurchase = function confirmPurchase(purchaseId) {
      session.selected = (session.is_direct) ? $scope.direct_purchase.get(purchaseId) : $scope.indirect_purchase.get(purchaseId);
    };

    $scope.confirmPayment = function confirmPayment () {
    	writeToJournal()
      .then(updatePurchase)
    	.then(generateDocument)
    	.catch(handleError);
    };

    function updatePurchase () {
    	var purchase = {
        	uuid         : session.selected.uuid,
        	confirmed    : 1,
          confirmed_by : $scope.idUser,
          paid         : 1
      };
      return connect.put('purchase', [purchase], ['uuid']);
    }

    function writeToJournal () {
      var query = (session.is_direct) ? '/confirm_direct_purchase/' + session.selected.uuid : '/confirm/' + session.selected.paid_uuid;
    	return connect.fetch('/journal' + query);
    }

    function paymentSuccess(result) {
      var purchase = {
        uuid : session.selected.uuid,
        paid : 1
      };
      return connect.put('purchase', [purchase], ['uuid']);
    }

    function generateDocument(res) {
      
      //$location.path('/invoice/confirm_indirect_purchase/' + session.selected.uuid);
      var query = (session.is_direct) ? '/confirm_direct_purchase/' + session.selected.uuid : '/confirm_indirect_purchase/' + session.selected.uuid;
      $location.path('/invoice' + query);
    }

    function handleError(error) {
      throw error;
    }

    function getDate() {
      var currentDate = new Date();
      return currentDate.getFullYear() + '-' + (currentDate.getMonth() + 1) + '-' + ('0' + currentDate.getDate()).slice(-2);
    }

    $scope.resetSelected = function () {
      session.selected = null;
    };
  }
]);
