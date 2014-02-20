angular.module('kpk.controllers').controller('accountsReport', function($scope, messenger, appstate, validate) {
  var dependencies = {};
 
  dependencies.account = {
    required: true,
    query: {
      identifier: 'account_number',
      tables: {
        'account': {
          columns: ["id", "account_txt", "account_number", "parent", "account_type_id"]
        }
      }
    }
  };

  validate.process(dependencies).then(accountsReport);
 
  function accountsReport(model) {
    appstate.register('enterprise', function(res) {
      $scope.enterprise = res;
      $scope.timestamp = new Date();
    });

    $scope.model = model;
    parseAccountDepth($scope.model.account.data, $scope.model.account);
  }
 
  function parseAccountDepth(accountData, accountModel) {
    accountData.forEach(function(account) {
      var parent, depth = 0;

      //TODO if parent.depth exists, increment and kill the loop (base case is ROOT_NODE)
      parent = accountModel.get(account.parent);
      depth = 0;
      while(parent) {
        depth += 1;
        parent = accountModel.get(parent.parent);
      }
      account.depth = depth;
    });
  }

  $scope.printReport = function() { print(); };
});
