angular.module('kpk.controllers')
.controller('mainCash', [
  '$scope',
  '$location',
  '$translate',
  'connect',
  'appcache',
  'appstate',
  'messenger',
  'validate',
  'exchange',
  'kpkUtilitaire',
  'precision',
  'calc',
  function($scope, $location, $translate, connect, appcache, appstate, messenger, validate, exchange, util, precision, calc) {
    var dependencies = {};
    dependencies.pcash_accounts = {
      query : {
        tables : {
          'currency_account': {
            columns : ['pcash_account']
          }
        }
      }
    }
    dependencies.summers = {
      query : '/synthetic/pcR/'
    }

    //functions

    function init (model){
      dependencies.summers.query = dependencies.summers.query+$scope.enterprise.id+'?'+JSON.stringify({accounts : formatTab(model)});
      console.log('notre model 1 est :', model);
      validate.process(dependencies, ['summers']).then(setUpModel);
    }

    function setUpModel (model){
      $scope.model = model;
    }

    function formatTab (m){
      return m.pcash_accounts.data.map(function (item){
        return item.pcash_account;
      });
    }

    appstate.register('enterprise', function (enterprise){
      $scope.enterprise = enterprise;
      dependencies.pcash_accounts.query.where = ['currency_account.enterprise_id='+$scope.enterprise.id, 'AND', 'currency_account.currency_id='+$scope.enterprise.currency_id];
      validate.process(dependencies, ['pcash_accounts']).then(init);
    });
  }
]);

