angular.module('kpk.controllers')
.controller('analysisCenter', [
  '$scope',
  '$q',
  'connect',
  'appstate',
  'messenger',
  function ($scope, $q, connect, appstate, messenger) {

    //variables init
    var requettes = {},
        models = $scope.models = {},
        enterprise = appstate.get('enterprise'); // FIXME: refactor this dependency

    $scope.register = {};
    $scope.selected = {};
    //$scope.account= {};
    $scope.acc2 = {};
    $scope.acc = {};

    requettes.cost_centers = {
      tables : {
        'cost_center' : {
          columns : ['id', 'text', 'note', 'cost']
        },
        'enterprise' : {
          columns :['name']
        }
      },
      join : ['cost_center.enterprise_id=enterprise.id']
    };

    requettes.criteres = {
      tables : {
        'critere' : {
          columns:['id', 'critere_txt', 'note']
        }
      }
    };

    //fonctions

    function init (records){
      models.cost_centers = records[0].data;
      models.availablesAccounts = records[1];
      models.criteres = records[2].data;
      transformDatas(models.availablesAccounts);
    }

    function setAction (value, index){
      $scope.action = value;
      if(value !== 'register') $scope.selected = models.cost_centers[index];
      if(value === 'configure') {
        $scope.selected = models.cost_centers[index];
        handleConfigure();
      }
    }

    function saveRegistration (){
      if (isCorrect()){
        $scope.register.enterprise_id = enterprise.id;
        connect.basicPut('cost_center', [connect.clean($scope.register)]).
        then(function (v){

          if(v.status === 200){
            messenger.info("successfully inserted");
            $scope.register = {};
            run();

          }

        });
      }else{
        messenger.danger('Principal cenetr Name undefined.');
      }
    }

    function isCorrect(){
      return ($scope.register.text)? true : false;
    }

    function run (){
      $q.all(
        [
          connect.req(requettes.cost_centers),
          getAvailablesAccounts(enterprise.id),
          connect.req(requettes.criteres)
        ])
      .then(init);
    }

    function transformDatas(tabl){
      tabl.map(function (item){
        item.checked = false;
      });
    }

    function checkAll (){
      models.availablesAccounts.forEach(function (item){
        item.checked = $scope.acc.all;
      });
    }

    function checkAll2 (){
      models.associatedAccounts.forEach(function (item){
        item.checked = $scope.acc2.all;
      });
    }

    function getAvailablesAccounts (enterprise_id){
      var def = $q.defer();
      connect.MyBasicGet('/availablechargeAccounts/'+enterprise_id+'/')
      .then(function(values){
        def.resolve(values);
      });
      return def.promise;
    }

    function associate (){

      var rek = models.availablesAccounts.filter(function (item){
        return item.checked;
      });

      $q.all(rek.map(function(item){
        item.cc_id = $scope.selected.id;
        delete item.checked;
        return connect.basicPost('account', [connect.clean(item)], ['id']);
      })).then( function(v){
        messenger.info('assignation successfully!');
        run();
        handleConfigure();
      });
    }

    function loadAssociateAccounts (){
      var def = $q.defer();
      connect.MyBasicGet('/costCenterAccount/'+enterprise.id+'/'+$scope.selected.id)
      .then(function(values){
        def.resolve(values);
      });
      return def.promise;
    }

    function handleConfigure(){
      loadAssociateAccounts()
      .then(function(values){
        models.associatedAccounts = values;
        transformDatas(models.associatedAccounts);

      });
    }

    function remove(){

      var rek = models.associatedAccounts.filter(function (item){
        return item.checked;
      });

      $q.all(rek.map(function(item){
        item.cc_id = -1;
        delete item.checked;
        return connect.basicPost('account', [connect.clean(item)], ['id']);
      })).then( function(v){
        messenger.info('assignation successfully!');
        run();
        handleConfigure();
      });

    }

    function formatCritere (critere){
      return critere.critere_txt;
    }

    //exposition

    $scope.setAction = setAction;
    $scope.saveRegistration = saveRegistration;
    $scope.checkAll = checkAll;
    $scope.formatCritere = formatCritere;
    $scope.associate = associate;
    $scope.remove = remove;

    //invocation
    run();

  }
]);
