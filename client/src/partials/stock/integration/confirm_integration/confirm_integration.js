angular.module('bhima.controllers')
.controller('ConfirmStockIntegrationController', ConfirmStockIntegrationController);

ConfirmStockIntegrationController.$inject = [
  '$scope', 'validate', 'appstate', 'connect', '$location', 'SessionService'
];

function ConfirmStockIntegrationController($scope, validate, appstate, connect, $location, Session) {
  var dependencies = {},
      session = $scope.session = { is_direct : false };

  dependencies.stock = {
    identifier : 'uuid',
    query      : '/stockIntegration/'
  };

  $scope.user = Session.user;
  $scope.project = Session.project;

  validate.process(dependencies)
  .then(initialise);

  function initialise(model) {
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
        confirmed_by : $scope.user.id,
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
    console.log(error);
  }
}
