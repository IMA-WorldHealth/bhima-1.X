angular.module('kpk.controllers')
.controller('AssignPatientGroupController', function ($scope, $q, connect, appstate, messenger) {
  'use strict';
  //variables init

  var requettes = {}, patient = {}, models = $scope.models = {}, stores = {},state = {}, enterprise = appstate.get('enterprise'), assignation_patients;
  requettes.patients = {
    tables : {'patient':{columns:['id', 'first_name', 'last_name', 'dob']}}
  };

  requettes.patient_groups = {
    tables : { 'patient_group':{ columns: ["id", "name"]}}
  };

  requettes.assignation_patients = {
    tables : { 'assignation_patient':{ columns: ["id", "patient_group_id", "patient_id"]}}
  };

  //fonctions

  function init (records){
    $scope.print = false;
    models.patients = records[0].data;
    models.patient_groups = records[1].data;
    assignation_patients = records[2].data;
    transformDatas(false);
    saveState();
  }

  var transformDatas = function (value){
    $scope.models.patient_groups.map(function(item){
      item.checked = value;
    });
  }

  $scope.decision = function (){
    if(!state.childrens) return false;
    var diff = false;
    for(var i = 0; i < state.childrens.length; i++){
      if(state.childrens[i].checked !== models.patient_groups[i].checked){
        diff = true;
        break;
      } 
    }
    var reponse = ($scope.all !== state.all || diff);

    return reponse;
  }

  $scope.showPatientGroups = function (index){
    transformDatas(false);
      patient = models.patients[index];
      $scope.print = true;      
      models.patient_groups.forEach(function (patient_group){

        assignation_patients.forEach(function (assignation_patient){
        if( assignation_patient.patient_id === 
            patient.id &&
            assignation_patient.patient_group_id ===
            patient_group.id          
          ) patient_group.checked = true;
        });
      });   

      var check = $scope.models.patient_groups.some(function (patient_group){
        return patient_group.checked !== true;
      });
    $scope.all = !check;
  }
  function saveState(){    
    state.childrens = models.patient_groups;
    state.all = $scope.all;
  }

  $scope.changeChildren = function(v){
    transformDatas(v);
  }

  function formatAccount (account){    
    return [account.account_number, account.account_txt].join(' -- ');
  }

  function run (){    
    $q.all(
      [
      connect.req(requettes.patients),
      connect.req(requettes.patient_groups),
      connect.req(requettes.assignation_patients)
      ]
    ).then(init);
  }

  function save (){

    connect.basicDelete('assignation_patient', patient.id, 'patient_id')
    .then(function (v){

      if (v.status === 200) {
        var ass_patient = [];
        
        var pg = models.patient_groups.filter(function(item){
          return item.checked === true;
        });

        pg.forEach(function(item){
          ass_patient.push({patient_group_id : item.id, patient_id : patient.id});
        });

        console.log(ass_patient)
        connect.basicPut('assignation_patient', ass_patient).then(function(v){
        });
      }
    });
  }

  //invocation
  run();


  $scope.formatAccount = formatAccount;
  $scope.save = save;

});
