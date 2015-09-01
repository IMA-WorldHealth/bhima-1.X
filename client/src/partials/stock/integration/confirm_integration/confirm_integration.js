angular.module('bhima.controllers')
.controller('stock.confirm_integration', [
  '$scope',
  'validate',
  'appstate',
  'connect',
  '$location',
  function ($scope, validate, appstate, connect, $location) {
    var dependencies = {}, session = $scope.session = { is_direct : false };

    dependencies.stock = {
      identifier : 'uuid',
      query      : '/stockIntegration/'
    };

    dependencies.user = {
      query : 'user_session'
    };

    dependencies.allUser = {
      identifier : 'id',
      query : {
        tables : {
          user : {columns : ['id', 'first', 'last']}
        }
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
      $scope.idUser = model.user.data.id;
      angular.extend($scope, model);
    }

    $scope.getStock = function (purchaseId) {
      session.selected = $scope.stock.get(purchaseId);
    };

    $scope.confirmIntegration = function () {
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
      var query = '/confirm_integration/' + session.selected.uuid;
    	return connect.fetch('/journal' + query);
    }

    function generateDocument(res) {
      var query = '/confirm_integration/' + session.selected.document_id;
      $location.path('/invoice' + query);
    }

    function handleError(error) {
      throw error;
    }

    $scope.getUser = function (id) {
      var user = $scope.allUser.get(id);
      return String(user.first + ' - ' + user.last);
    };

    function getDate() {
      var currentDate = new Date();
      return currentDate.getFullYear() + '-' + (currentDate.getMonth() + 1) + '-' + ('0' + currentDate.getDate()).slice(-2);
    }

    $scope.resetSelected = function () {
      session.selected = null;
    };
  }
]);
