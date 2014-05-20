angular.module('bhima.controllers')
.controller('versement', [
  '$scope',
  '$q',
  'connect',
  'appstate',
  'messenger',
  'validate',
  function ($scope, $q, connect, appstate, messenger, validate) {

    var dependencies= {}, configuration = {};

    dependencies.cost_centers = {
      query : {
        tables : {
          'cost_center' : {
            columns : ['id', 'text', 'note', 'cost']
          },
          'project' : {
            columns :['name']
          }
        },
        join : ['cost_center.project_id=project.id']
      }
    }

    function init (model){
      $scope.model = model;
      $scope.acc_1 = {}; $scope.acc_1.all = false;
      $scope.acc_2 = {}; $scope.acc_2.all = false;
      filling();
    }

    function filling (){
      getAvailablesAccounts($scope.project.enterprise_id)
      .then(function (records){
        $scope.model.available_accounts = records;
      })
    }

    function getAvailablesAccounts (enterprise_id){
      var def = $q.defer();
      connect.req('/availableAccounts/'+enterprise_id+'/')
      .then(function(values){
        def.resolve(values);
      });
      return def.promise;
    }

    function checkAll_1 (){
      $scope.model.available_accounts.data.forEach(function (item){
        item.checked = $scope.acc_1.all;
      });
    }

    function checkAll_2 (){
      $scope.model.associatedAccounts.data.forEach(function (item){
        item.checked = $scope.acc_2.all;
      });
    }

    function performChange () {
      $scope.selected_cost_center = JSON.parse($scope.configuration.cost_center);
      loadCenterAccount()
      .then(function (results){
        $scope.model.associatedAccounts = results;
      })
    }

    function verser (){
      var accounts = sanitize(); //accounts to associate
      updateAccounts(accounts)
        .then(function (result){
          $scope.selected_accounts.forEach(function (item){
            $scope.model.available_accounts.remove(item.id);
            item.checked =false;
            $scope.model.associatedAccounts.post(item);
          });
        });
    }

    function remove (){
      preprocess();
      removeFromCostCenter()
      .then(function (result) {
        $scope.tabs.forEach(function (account){
          $scope.model.associatedAccounts.remove(account.id);
        });


      });
    }

    function preprocess (){
      $scope.tabs = $scope.model.associatedAccounts.data.filter(function (item){
        return item.checked;
      }); //contains acount to remove from cost_center
    }

    function removeFromCostCenter(){
      return connect.req('/removeFromCostCenter/'+JSON.stringify($scope.tabs));
    }

    function updateAccounts (accounts){
      return $q.all(
        accounts.map(function (account){
          return connect.basicPost('account', [account], ['id']);
        })
      )
    }

    function sanitize (){
      $scope.selected_accounts = $scope.model.available_accounts.data.filter(function (account){
          return account.checked;
      });

      return $scope.selected_accounts.map(function (account){
        return {cc_id : $scope.selected_cost_center.id, id : account.id};
      });
    }

    function loadCenterAccount (){
      return connect.req('/costCenterAccount/'+$scope.project.enterprise_id+'/'+$scope.selected_cost_center.id);
    }

    function isVersable (){
      if (!configuration.cost_center) return false;
      if(!$scope.model.available_accounts.data.length) return false;
      return $scope.model.available_accounts.data.some(function (account){
        return account.checked;
      })
    }

    function isRemovable (){
      if (!configuration.cost_center) return false;
      if (!$scope.model.associatedAccounts) return false
      if (!$scope.model.associatedAccounts.data.length) return false;
      return $scope.model.associatedAccounts.data.some(function (account){
        return account.checked;
      });

    }

    appstate.register('project', function (project){
      $scope.project = project;
      validate.process(dependencies).then(init);
    })

    $scope.checkAll_1 = checkAll_1;
    $scope.checkAll_2 = checkAll_2;
    $scope.performChange = performChange;
    $scope.configuration = configuration;
    $scope.verser = verser;
    $scope.remove = remove;
    $scope.isVersable = isVersable;
    $scope.isRemovable = isRemovable;
  }
]);
