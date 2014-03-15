angular.module('kpk.controllers')
.controller('AssignPatientGroup', [
  '$scope',
  '$q',
  'connect',
  'validate',
  'appstate',
  'messenger',
  'uuid',
  function ($scope, $q, connect, validate, appstate, messenger, uuid) {

    //variables init
    var dependencies = {},
        models = $scope.models = {},
        state = {},
        assignation_patients;

    $scope.flags = {};
    $scope.print = false;
    $scope.patient = {};

    dependencies.patient_group = {
      required : true,
      query : {
        tables : { 'patient_group':{ columns: ["uuid", "name"]}}
      }
    };

    // dependencies.patient = {
    //   required : true,
    //   query : {
    //     tables : {'patient':{columns:['uuid', 'first_name', 'last_name', 'dob']}}
    //   }
    // };

    dependencies.assignation_patient = {
      query : {
        tables : { 'assignation_patient':{ columns: ["uuid", "patient_group_uuid", "patient_uuid"]}}
      }
    };
    
    //fonctions
    function init (model){
      for (var k in model) {
        $scope[k] = model[k];
        models[k] = $scope[k].data;
      }
      transformDatas(false);
      $scope.all = false;
      state.all = false;
    }

    function errorDependencies (err) {
      messenger.danger([err.message, err.reference].join(' '));
    }

    function transformDatas (value){
      models.patient_group.map(function(item){
        item.checked = value;
      });
    }

    function decision (){
      var diff = false;
      for(var i = 0; i < models.patient_group.length; i+=1){
        console.log('validating', models.patient_group[i]);
        if(models.patient_group[i].checked){
          diff = true;
          break;
        }
      }
      return diff;
    }

    function loadPatientGroups (patient){
      var index = patient.id;

      transformDatas(false);
      $scope.patient = patient;
      $scope.print = true;

      models.patient_group.forEach(function (pg){
        $scope.assignation_patient.data.forEach(function (ap){
          if (ap.patient_uuid === $scope.patient.uuid &&
              ap.patient_group_uuid === pg.uuid) {
            pg.checked = true;
          }
        });
      });

      var check = models.patient_group.some(function (pg){
        return pg.checked !== true;
      });
      $scope.all = !check;
    }

    function changeChildren (v){
      //
      transformDatas(v);
    }

    function formatAccount (account){
      return [
        account.account_number, account.account_txt
      ].join(' -- ');
    }

    function save (){
      var tapon=[]; //will contain data witch will be inserted

      connect.basicDelete('assignation_patient', $scope.patient.uuid, 'patient_uuid')
      .then(function (v){

        if (v.status === 200) {
          $scope.assignation_patient.data = $scope.assignation_patient.data.filter(function (item){
            return item.patient_uuid !== $scope.patient.uuid;
          });
          var ass_patient = [];
      
          var pg_checked = models.patient_group.filter(function(item){
            return item.checked;
          });

          pg_checked.forEach(function(item){
            ass_patient.push({uuid: uuid(), patient_group_uuid : item.uuid, patient_uuid : $scope.patient.uuid});
          });

          $q.all(
            ass_patient.map(function(assignation){
              tapon.push(assignation);
              return connect.basicPut('assignation_patient', [assignation]);
            })
            ).then(function(res){
              for(var i=0; i<tapon.length; i+=1){
                tapon[i].id = res[i].data.insertId;
                $scope.assignation_patient.post(tapon[i]);
              }
              messenger.success('Successfully updated');
              // $scope.patient = {};
            }, function(err){
              messenger.danger('Error updating');
            });
        }
      });
    }

    function checking(){
      if($scope.patient.uuid && ($scope.all || decision())){
        save();
      }else{
        messenger.danger('Select a patient and Check at least one check box');
      }
    }

    //invocation

    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      dependencies.patient_group.query.where = ['patient_group.enterprise_id='+enterprise.id];
      validate.process(dependencies).then(init, errorDependencies);
    });

    //exposition

    $scope.formatAccount = formatAccount;
    $scope.checking = checking;
    $scope.changeChildren = changeChildren;
    $scope.loadPatientGroups = loadPatientGroups;
  }
]);
