angular.module('bhima.controllers')
.controller('accountsReport', [
  '$scope',
  '$translate',
  'appstate',
  'validate',
  function($scope, $translate, appstate, validate) {
    var dependencies = {},
      session = $scope.session = {};

    function accountsReport(model) {
      appstate.register('enterprise', function(res) {
        $scope.enterprise = res;
        $scope.timestamp = new Date();
      });

      $scope.model = model;
      sortAccounts($scope.model.account);
      parseAccountDepth($scope.model.account.data, $scope.model.account);
    }

    function sortAccounts(accountModel) {
      var data = accountModel.data;

      data.sort(function (a, b) {
        var left = String(a.account_number), right = String(b.account_number);
        return (left === right) ? 0 : (left > right ? 1 : -1);
      });
      accountModel.recalculateIndex();
    }

    function parseAccountDepth(accountData, accountModel) {
      accountData.forEach(function (account) {
        var parent, depth = 0;

        //TODO if parent.depth exists, increment and kill the loop (base case is ROOT_NODE)
        parent = accountModel.get(account.parent);
        depth = 0;
        while (parent) {
          depth += 1;
          parent = accountModel.get(parent.parent);
        }
        account.depth = depth;
      });
    }

    $scope.search = function search() {

      dependencies.account = {
        query: {
          tables: {
            'account': {
              columns: ['id', 'account_txt', 'account_number', 'is_ohada']
            }
          },
          where : ['account.is_ohada=' + session.type]
        }
      };

      session.type = parseInt(session.type);

      if(session.type === 1){
        $scope.title = $translate.instant('COLUMNS.OHADA');
      } else if (session.type === 0) {
        $scope.title = $translate.instant('COLUMNS.PCGC');
      }

      $scope.state = 'generate';
      validate.process(dependencies).then(accountsReport);
      $scope.printReport = function() { print(); };
    };

    $scope.print = function print() {
      window.print();
    };

    function reconfigure () {
      $scope.state = null;
      $scope.session.type = null;
      $scope.session.limit = null;
      $scope.model = null;
    }

    $scope.reconfigure = reconfigure;
  }
]);
