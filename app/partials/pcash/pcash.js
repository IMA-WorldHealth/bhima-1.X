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
  'util',
  'precision',
  'calc',
  function($scope, $location, $translate, connect, appcache, appstate, messenger, validate, exchange, util, precision, calc) {
    var dependencies = {};

    dependencies.pcash_accounts = {
      query : {
        tables : {
          'cash_box_account_currency': {
            columns : ['account_id']
          },
          'cash_box' : {
            columns : ['project_id']
          }
        },
        join : ['cash_box.id=cash_box_account_currency.cash_box_id']
      }
    };

    dependencies.summers = {
      query : '/synthetic/pcR/'
    };

    //functions

    function handleErrors(error) {
      messenger.danger('An Error occured:' + JSON.stringify(Error));
    }

    function init (model){
      dependencies.summers.query = dependencies.summers.query+$scope.project.enterprise_id+'?'+JSON.stringify({accounts : formatTab(model)});
      validate.process(dependencies, ['summers'])
      .then(setUpModel)
      .catch(handleErrors);
    }

    function setUpModel (model){
      $scope.model = model;
    }

    function formatTab (m){
      return m.pcash_accounts.data.map(function (item){
        return item.pcash_account;
      });
    }

    appstate.register('project', function (project){
      $scope.project = project;
      dependencies.pcash_accounts.query.where = ['cash_box.project_id='+$scope.project.id, 'AND', 'cash_box_account_currency.currency_id='+$scope.project.currency_id];
      validate.process(dependencies, ['pcash_accounts']).then(init);
    });
  }
]);

