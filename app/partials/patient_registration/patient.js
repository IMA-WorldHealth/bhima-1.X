angular.module('kpk.controllers')
.controller('patientRegistration', [
  '$scope',
  '$q',
  '$location',
  '$modal',
  'connect',
  'validate',
  'appstate',
  function($scope, $q, $location, $modal, connect, validate, appstate) {
    var dependencies = {},
        defaultBirthMonth = '06-01';

    $scope.location = {};
    $scope.patient = {};
    $scope.country = {};
    $scope.province = {};
    $scope.sector = {};
    $scope.village = {};
    $scope.current_country = {};
    $scope.current_province = {};
    $scope.current_sector = {};
    $scope.current_village = {};
    $scope.data = {};
    $scope.assignation = {};
    $scope.sessionProperties = {};

    // TODO: complete this
    dependencies.location = {
      query : {
        tables : {
          columns: []
        }
      }
    };

    dependencies.patientGroup = {
      query : { tables : {'patient_group' : {'columns' : ['id', 'name']}}}
    };
  
    dependencies.debtorGroup = {
      query : { tables : {'debitor_group' : {'columns' : ['id', 'name', 'note']}}}
    };

    dependencies.village = {
      query : { tables : { 'village' : { 'columns' : ['id', 'name', 'sector_id'] }}}
    };

    dependencies.sector = {
      query : { tables : { 'sector' : { 'columns' : ['id', 'name', 'province_id'] }}}
    };

    dependencies.province = {
      query : { tables : { 'province' : { 'columns' : ['id', 'name', 'country_id'] }}}
    };

    dependencies.country = {
      query : { tables : { 'country' : { 'columns' : ['id', 'country_en'] }}}
    };
  

    function patientRegistration(model) {
      $scope.model = model;
      handlePatientImage();
      initSelect($scope.enterprise.location_id);
    }
    
    function handlePatientImage() {

      //FIXME This is super cheeky in angular - create a directive for this
      var video = document.querySelector('#patientImage'), patientResolution = { video : { mandatory : { minWidth: 300, maxWidth: 400 } } };
    
      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
    
      function videoError(error) {
        //throw error;
        //console.error(error);
      }
    
      function handleVideo(stream) {
        video.src = window.URL.createObjectURL(stream);
      }

      if (navigator.getUserMedia) {
        navigator.getUserMedia(patientResolution, handleVideo, videoError);
      }
    
    }
  
    function registerPatient(patient) {
      getVillageId($scope.village.name, $scope.sector.sector_id)
      .then(function(origin_id){
        patient.origin_location_id = origin_id;
        getVillageId($scope.current_village.name, $scope.current_sector.sector_id)
        .then(function(current_id){
          patient.current_location_id = current_id;
          if(patient.origin_location_id && patient.current_location_id){
            writePatient(patient);
          }
        });
      });
    }

    function getVillageId(name, id_sector){
      var id;
      var def = $q.defer();
      for(var i = 0; i<$scope.model.village.data.length; i+=1){
        if($scope.model.village.data[i].name.toUpperCase() === name.toUpperCase() && $scope.model.village.data[i].sector_id === id_sector){
          id = $scope.model.village.data[i].id;
          //console.log(id);
          break;
        }
      }

      if(id) {
        //console.log('le village existe deja');
        def.resolve(id);
      }else{
        //console.log('nous devons ajouter le village');
        var toInputVillage = {
          name : name,
          sector_id : id_sector
        };
        connect.basicPut('village', [toInputVillage]).then(function(v){
          toInputVillage.id = v.data.insertId;
          $scope.model.village.post(toInputVillage);
          //console.log('le modele a change', $scope.model.village);
          return def.resolve(v.data.insertId);
        });
      }
      return def.promise;
    }

    function writePatient(patient) {
      var packageDebtor = {
        group_id : $scope.debtor.debtor_group.id,
        text : 'Debtor ' + patient.first_name + ' ' + patient.last_name,
      };

      connect.basicPut('debitor', [packageDebtor]).then(function(result) {
        patient.debitor_id = result.data.insertId;
        connect.basicPut('patient', [patient]).then(function(result) {
          $scope.submitted = true;
          if($scope.assignation.patient_group_id){
            $q.all(
            $scope.assignation.patient_group_id.map(function (patient_group_id){
              var pg = {patient_group_id : patient_group_id, patient_id : result.data.insertId};
              return connect.basicPut('assignation_patient', [pg]);
            })
            ).then(function (v){
              $location.path('invoice/patient/' + result.data.insertId);
            });
          } else{
            $location.path('invoice/patient/' + result.data.insertId);
          }
        });
      });
    }



    function handleOriginCountryChange(){
      //console.log('cahangement');
    }
   
    //Utility methods
    $scope.$watch('sessionProperties.yob', function(nval) {
      if(nval && nval.length===4) $scope.patient.dob = nval + '-' + defaultBirthMonth;
    });

    function enableFullDate() { $scope.sessionProperties.fullDateEnabled = true; }
  
    function checkChanged(model) { return angular.equals(model, $scope.master); }

    function initSelect(village_id){

      $scope.village = angular.copy($scope.model.village.get(village_id));
      $scope.sector = angular.copy($scope.model.sector.get($scope.village.sector_id));
      $scope.sector.sector_id = $scope.sector.id;
      $scope.province = angular.copy($scope.model.province.get($scope.sector.province_id));
      $scope.province.province_id = $scope.province.id;
      $scope.country = angular.copy($scope.model.country.get($scope.province.country_id));
      $scope.country.country_id = $scope.country.id;

      $scope.current_village =angular.copy($scope.model.village.get(village_id));
      $scope.current_sector = angular.copy($scope.model.sector.get($scope.current_village.sector_id));
      $scope.current_sector.sector_id = $scope.current_sector.id;
      $scope.current_province = angular.copy($scope.model.province.get($scope.current_sector.province_id));
      $scope.current_province.province_id = $scope.current_province.id;
      $scope.current_country = angular.copy($scope.model.country.get($scope.current_province.country_id));
      $scope.current_country.country_id = $scope.current_country.id;
    }

    // invocation

    appstate.register('enterprise', function(enterprise){
      $scope.enterprise = enterprise;
      validate.process(dependencies).then(patientRegistration);
    });
  
    //Expose methods to scope

    $scope.registerPatient = registerPatient;
    $scope.enableFullDate = enableFullDate;
    $scope.checkChanged = checkChanged;
  }
]);
