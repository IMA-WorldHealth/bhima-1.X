angular.module('kpk.controllers')
.controller('patientRegController', function($scope, $q, $location, connect, $modal, kpkConnect, appstate) {
  'use strict';

  var patient_model = {};
  var submitted = false;
  var default_patientID = 1;
	
	$scope.patient = {};


  function init() { 
    //register patient for appcahce namespace
    var default_group = 3; //internal patient

    var location_request = connect.req({'tables' : {'location' : {'columns' : ['id', 'city', 'region']}}});
    //This was if we needed to create alpha-numeric (specific) ID's
    var patient_request = connect.req({'tables' : {'patient' : {'columns' : ['id']}}});
    //Used to generate debtor ID for patient
    //      FIXME just take the most recent items from the database, vs everything?
    var debtor_request = connect.req({'tables' : {'debitor' : {'columns' : ['id']}}});
    var debtor_group_request = connect.req({'tables' : {'debitor_group' : {'columns' : ['id', 'name', 'note']}}});

    $q.all([location_request, patient_request, debtor_request, debtor_group_request])
    .then(function(res) { 
      $scope.location_model = res[0];
      $scope.patient_model = res[1];
      $scope.debtor_model = res[2];
      $scope.debtor_group_model = res[3];
      //$scope.location = $scope.location_model.data[0]; //select default

      $scope.debtor = {};
      //$scope.debtor.debtor_group = $scope.debtor_group_model.get(default_group);
    });
  }
	
	$scope.$watch('patient.yob', function(nval, oval) {
		var DEFAULT_DATE = '-06-01';	
		//temporary date validation
		if(!nval || nval.length != 4) return;
		$scope.patient.dob = nval + DEFAULT_DATE; 	
	});

  function createId(data) {
    if(data.length===0) return default_patientID;
    var search = data.reduce(function(a, b) { a = a.id || a; return Math.max(a, b.id); });
    console.log("found", search);
    // quick fix
    search = (search.id !== undefined) ? search.id : search;
    //if (search.id) search = search.id;
    return search + 1;
  }

  $scope.update = function(patient) {
    //      download latest patient and debtor tables, calc ID's and update
    var patient_request = connect.req({'tables' : {'patient' : {'columns' : ['id']}}});
    var debtor_request = connect.req({'tables' : {'debitor' : {'columns' : ['id']}}});

    var patient_model, debtor_model;

    //      TODO verify patient data is valid

    $q.all([debtor_request, patient_request])
      .then(function(res) {
        debtor_model = res[0];
        patient_model = res[1];


        patient.id = createId(patient_model.data);
        patient.debitor_id = createId(debtor_model.data);
        console.log("created p_id", patient.id);
        console.log("created id", patient.debitor_id);

        commit(patient);
      });
    }

    function createId(data) {
      if(data.length===0) return default_patientID;
      var search = data.reduce(function(a, b) { a = a.id || a; return Math.max(a, b.id); });
      console.log("found", search);
      // quick fix
      search = (search.id !== undefined) ? search.id : search;
      //if (search.id) search = search.id;
      return search + 1;
    }

    $scope.update = function(patient) {
      //      download latest patient and debtor tables, calc ID's and update
      var patient_request = connect.req({'tables' : {'patient' : {'columns' : ['id']}}});
      var debtor_request = connect.req({'tables' : {'debitor' : {'columns' : ['id']}}});

      var patient_model, debtor_model;

      //      TODO verify patient data is valid

      $q.all([debtor_request, patient_request])
        .then(function(res) {
          debtor_model = res[0];
          patient_model = res[1];

					var package_patient = { 
						id: createId(patient_model.data),
						debitor_Id: createId(debtor_model.data),
						first_name: patient.first_name,
						last_name: patient.last_name,
						dob: patient.dob,
						sex: patient.sex,
						location_id: patient.location_id
					};

          patient.id = createId(patient_model.data);
          patient.debitor_id = createId(debtor_model.data);
          console.log("created p_id", patient.id);
          console.log("created id", patient.debitor_id);
					//sorry, sorry - package patient as seperate object
					console.log('deleting yob');	
					delete(patient.yob);
          commit(patient);
        });
    };

    function commit(patient) {

      var debtor = $scope.debtor;
      patient_model = patient;

			console.log('pm', patient_model);
      var format_debtor = {id: patient_model.debitor_id, group_id: $scope.debtor.debtor_group.id, text:patient_model.first_name+' - '+patient_model.last_name};
      console.log("requesting debtor;", format_debtor);
      //Create debitor record for patient - This SHOULD be done using an alpha numeric ID, like p12
      // FIXME 1 - default group_id, should be properly defined
      connect.basicPut("debitor", [format_debtor])
      .then(function(res) { 
        //Create patient record
        console.log("Debtor record added", res);
        connect.basicPut("patient", [patient_model])
        .then(function(res) {
          $location.path("patient_records/" + res.data.insertId);
          submitted = true;
        });
      });
  }

  $scope.formatLocation = function(l) { 
    return l.city + ", " + l.region;
  };

  $scope.checkChanged = function(model) { 
      return angular.equals(model, $scope.master);
  };

  $scope.checkSubmitted = function() { 
    return submitted;
  };

  function getGroups(){
    var req_db = {};
    req_db.e = [{t:'debitor_group', c:['id', 'name']}];
    req_db.c = [{t:'debitor_group', cl:'locked', z:'=', v:0}];
    kpkConnect.get('/data/?', req_db).then(function(data){
      $scope.debtor_group_model.data = data;
    });
  }

  init();

});
