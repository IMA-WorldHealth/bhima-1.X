angular.module('kpk.controllers')
.controller('principalAnalysisCenter', function ($scope, $q, connect, appstate, messenger) {
  'use strict';

  //variables init
  var requettes = {}, models = $scope.models = {}, enterprise = appstate.get('enterprise');
  $scope.register = {};
  $scope.selected = {};
  $scope.acc ={};
  requettes.pricipal_centers = {
    tables : {'principal_center':{columns:['id', 'text', 'note', 'cost']}, 
              'enterprise' : {columns :['name']}},
    join : ['principal_center.enterprise_id=enterprise.id']
  }


  //fonctions

  function init (records){
    models.principal_centers = records[0].data;
    models.availablesAccounts = records[1];    
    transformDatas();
  }

  function setAction (value, index){
    $scope.action = value;
    if(value !== 'register') $scope.selected = models.principal_centers[index];
    //if(value === 'configure') handleConfigure();
  }

  function saveRegistration (){
    if (isCorrect()){
      $scope.register.enterprise_id = enterprise.id;
      connect.basicPut('principal_center', [connect.clean($scope.register)]).
      then(function (v){
        console.log(v);

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
        connect.req(requettes.pricipal_centers),
        getAvailablesAccounts(enterprise.id)//,
        //loadAssociateAccounts
      ])
    .then(init);
  }

  function transformDatas(){
    models.availablesAccounts.map(function (item){
      item.checked = false;
    });
  }

  function checkAll (){
    models.availablesAccounts.forEach(function (item){
      item.checked = $scope.acc.all;
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
      item.principal_center_id = $scope.selected.id;
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
    connect.MyBasicGet('/principalCenterAccount/'+enterprise.id+'/'+$scope.selected.id)
    .then(function(values){
      def.resolve(values);
    });
    return def.promise;
  }

  function handleConfigure(){
    loadAssociateAccounts()
    .then(function(values){
      models.associatedAccounts = values;
    });
  }

  //exposition

  $scope.setAction = setAction;
  $scope.saveRegistration = saveRegistration;
  $scope.checkAll = checkAll;
  //$scope.associate = associate;

  //invocation
  run();


});