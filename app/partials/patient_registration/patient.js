angular.module('kpk.controllers')
.controller('patientRegistration', [
  '$scope',
  '$q',
  '$location',
  'connect',
  'messenger',
  'validate',
  'appstate',
  function($scope, $q, $location, connect, messenger, validate, appstate) {

    var dependencies = {},
        defaultBirthMonth = '06-01';

    $scope.assignation = {};
    $scope.sessionProperties = {};
    $scope.patient = {};
    /*
    dependencies.patientGroup = {
      query : { tables : {'patient_group' : {'columns' : ['id', 'name']}}}
    };
    */
 
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
      query : { tables : { 'country' : { 'columns' : ['id', 'country_en', 'country_fr'] }}}
    };
 
    function patientRegistration(model) {
      for (var k in model) { $scope[k] = model[k]; }

      // set up location models
      $scope.current = {};
      $scope.origin = {};

      // webcams for the win
      handlePatientImage();

      // set the $scope.origin and $scope.current location variables
      ['origin', 'current']
      .forEach(function (param) {
        $scope[param].village = $scope.village.get($scope.enterprise.location_id);
        $scope[param].sector = $scope.sector.get($scope[param].village.sector_id);
        $scope[param].province = $scope.province.get($scope[param].sector.province_id);
        $scope[param].country = $scope.country.get($scope[param].province.country_id);
      });

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
 
    $scope.registerPatient = function registerPatient() {

      // This is overly verbose, but works and is clean
      var defer = $q.defer();
      // if the villages are strings, create database entries for them
      if (angular.isString($scope.origin.village) && angular.isString($scope.current.village)) {
        createVillage($scope.origin.village, $scope.origin.sector.id, 'origin')
        .then(createVillage($scope.current.village, $scope.current.sector.id, 'current'))
        .then(function () {
          defer.resolve();
        });
      } else if (angular.isString($scope.origin.village)) {
        createVillage($scope.origin.village, $scope.origin.sector.id, 'origin')
        .then(function () {
          defer.resolve();
        });
      } else if (angular.isString($scope.current.village)) {
        createVillage($scope.current.village, $scope.current.sector.id, 'current')
        .then(function () {
          defer.resolve();
        });
      } else {
        defer.resolve();
      }

      defer.promise.then(function () {
        var patient = $scope.patient;
        patient.current_location_id = $scope.current.village.id;
        patient.origin_location_id = $scope.origin.village.id;
        writePatient(patient);
      });
    };


    function createVillage(village, sector_id, writeTo) {
      return connect.basicPut('village', [{
        name : village,
        sector_id : sector_id
      }])
      .success(function(success) {
        $scope[writeTo].village = {
          name : name,
          sector_id : sector_id,
          id : success.insertId
        };
      })
      .error(function(err) {
        messenger.danger('An Error occured writing the village');
      });
    }

    function getVillageId(name, id_sector){
      var id;
      var def = $q.defer();
      for(var i = 0; i<$scope.village.data.length; i+=1){
        if($scope.village.data[i].name.toUpperCase() === name.toUpperCase() && $scope.village.data[i].sector_id === id_sector){
          id = $scope.village.data[i].id;
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
          $scope.village.post(toInputVillage);
          //console.log('le modele a change', $scope.village);
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
          $location.path('invoice/patient/' + result.data.insertId);
        });
      });
    }

    //Utility methods
    $scope.$watch('sessionProperties.yob', function(nval) {
      if(nval && nval.length===4) $scope.patient.dob = nval + '-' + defaultBirthMonth;
    });

    $scope.enableFullDate = function enableFullDate() {
      $scope.sessionProperties.fullDateEnabled = true;
    };
 
    function handleError (err) {
      messenger.danger('An Error Occured : ' + JSON.stringify(err));
    }

    // invocation

    appstate.register('enterprise', function(enterprise){
      $scope.enterprise = enterprise;
      validate.process(dependencies)
      .then(patientRegistration, handleError);
    });
 
  }
]);
