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

  $scope.flags = {}
  $scope.print = false;
  //fonctions

  function init (records){
    
    models.patients = records[0].data;
    models.patient_groups = records[1].data;
    assignation_patients = records[2].data;
    transformDatas(false);
    state.childrens = records[1].data;
    $scope.all = false;
    state.all = false;
  } 

  var transformDatas = function (value){
    $scope.models.patient_groups.map(function(item){
      item.checked = value;
    });
  }

  function decision (){
    var diff = false;
    for(var i = 0; i < models.patient_groups.length; i++){
      if(models.patient_groups[i].checked){
        diff = true;
        break;
      } 
    }
    return diff;
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
          return item.checked;
        });

        pg.forEach(function(item){
          ass_patient.push({patient_group_id : item.id, patient_id : patient.id});
        });

        $q.all(
          ass_patient.map(function(assignation){
            return connect.basicPut('assignation_patient', [assignation]);
          })
          ).then(function(res){            
            messenger.success('Successfully updated');
            patient = {};
            run();
          }, function(err){
            messenger.danger('Error updating');
          });
        // connect.basicPut('assignation_patient', ass_patient).then(function(v){
        //   console.log(v);
        // });
      }
    });
  }

  function checking(){
    if(patient.id && ($scope.all || decision())){
      save();
    }else{
      messenger.danger('Select a patient and Check at least one check box');
    }    
  }

  //invocation
  run();


  $scope.formatAccount = formatAccount;
  $scope.checking = checking;

});
