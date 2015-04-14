angular.module('bhima.controllers')
.controller('confirmDonation', [
  '$scope',
  'validate',
  'appstate',
  'connect',
  '$location',
  function ($scope, validate, appstate, connect, $location) {
    var dependencies = {}, session = $scope.session = {};

    dependencies.donations = {
      query : {
        identifier : 'uuid',
        tables : {
          donations : {columns : ['uuid', 'date', 'is_received']},
          donor     : {columns : ['name']},
          employee  : {columns : ['prenom', 'name::nom_employee', 'postnom']}
        },
        join : ['donor.id=donations.donor_id', 'donations.employee_id=employee.id'],
        where : ['donations.is_received=' + 1, 'AND', 'donations.is_confirmed='+ 0]
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

    function confirmDonation(purchaseId) {
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

    $scope.confirmDonation = confirmDonation;
  }
]);
