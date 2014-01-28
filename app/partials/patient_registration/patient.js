angular.module('kpk.controllers').controller('patientRegistration', function($scope, $q, $location, $modal, connect, validate, appstate) {
  var dependencies = {}, submitted = false, defaultPatientId = 1;
	$scope.patient = {}, $scope.data = {};
  
  dependencies.debtorGroup = { 
    query : {'tables' : {'debitor_group' : {'columns' : ['id', 'name', 'note']}}}
  };

  dependencies.village = { 
    query : { tables : { 'village' : { 'columns' : ['id', 'name'] }}}
  };

  dependencies.sector = { 
    query : { tables : { 'sector' : { 'columns' : ['id', 'name'] }}}
  };

  dependencies.province = { 
    query : { tables : { 'province' : { 'columns' : ['id', 'name'] }}}
  };

  dependencies.country = { 
    query : { tables : { 'country' : { 'columns' : ['id', 'country_en'] }}}
  };

  dependencies.location = { 
    query : { tables : { 'location' : { 'columns' : ['id', 'village_id', 'sector_id', 'country_id'] }}}
  };

  validate.process(dependencies).then(patientRegistration);

  function patientRegistration(model) { 
    $scope.model = model;
  }

	$scope.$watch('patient.yob', function(nval, oval) {
		var DEFAULT_DATE = '-06-01';	
		//temporary date validation
		if(!nval || nval.length != 4) return;
    $scope.patient.dob = nval + DEFAULT_DATE;
	});

  function createId(data) {
    if(data.length===0) return defaultPatientId;
    var search = data.reduce(function(a, b) { a = a.id || a; return Math.max(a, b.id); });
    // quick fix
    search = (search.id !== undefined) ? search.id : search;
    //if (search.id) search = search.id;
    return search + 1;
  }
 
  $scope.selectLocation = function selectLocation () {
    $scope.data.oldLocaton = true;
  };

  $scope.$watch('data.village_id', function () {
    // reset the oldLocation flag if the model changes.
    $scope.data.oldLocation = false;
  });

  // TODO: Clean this code up.
  function setLocation () {
    var defer = $q.defer();

    // create location data if not exists
    var location_data;
    var data = $scope.data;
    if ($scope.data.oldLocation) {
      location_data = {
        country_id : data.country_id,
        province_id : data.province_id,
        sector_id : data.sector_id,
        village_id : data.village_id
      };

      connect.basicPut('location', [location_data])
      .then(function (result) {
        defer.resolve(result.data.insertId);
      }, function (error) {
        defer.reject(error);
      });

    } else {
      connect.basicPut('village', [{name: data.village_id}])
      .then(function (result) {
        console.log("result is:", result);
        var id = result.data.insertId;
        location_data = {
          country_id : data.country_id,
          province_id : data.province_id,
          sector_id : data.sector_id,
          village_id : id 
        };

        connect.basicPut('location', [location_data])
        .then(function (result) {
          defer.resolve(result.data.insertId);
        }, function (error) {
          defer.reject(error);
        });
      }); 
    }

    return defer.promise;
  }

  $scope.update = function(patient) {
    //      download latest patient and debtor tables, calc ID's and update
    var patient_request = connect.req({'tables' : {'patient' : {'columns' : ['id']}}});
    var debtor_request = connect.req({'tables' : {'debitor' : {'columns' : ['id']}}});

    var patient_model, debtor_model;

    setLocation().then(function (id) {
      console.log("setLocation returned:", id);

      //      TODO verify patient data is valid
      //

      $q.all([debtor_request, patient_request])
        .then(function(res) {
          debtor_model = res[0];
          patient_model = res[1];

          // What does this do?  It isn't reference again..
          var package_patient = { 
            id: createId(patient_model.data),
            debitor_Id: createId(debtor_model.data),
            first_name: patient.first_name,
            last_name: patient.last_name,
            dob: patient.dob,
            sex: patient.sex,
            location_id: id
          };

          patient.id = createId(patient_model.data);
          patient.debitor_id = createId(debtor_model.data);
          patient.location_id = id; // Should this be in package_patient?
          console.log("created p_id", patient.id);
          console.log("created id", patient.debitor_id);
          //sorry, sorry - package patient as seperate object
          console.log('deleting yob');	
          delete(patient.yob);
          commit(patient);
        });
    });
  };

  function commit (patient) {

    console.log("Patient:", patient);

    var debtor = $scope.debtor;
    patient_model = patient;

		console.log('pm', patient_model);
    var format_debtor = {
      id: patient_model.debitor_id,
      group_id: $scope.debtor.debtor_group.id,
      text:patient_model.first_name+' - '+patient_model.last_name
    };
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
    var request = {
      tables : { 'debitor_group' : { columns : ['id', 'name']}},
      where : ['debitor_group.locked='+0]
    };
    connect.fetch(request).then(function (data) {
      $scope.debtor_group_model.data = data;
    });
  }

  $scope.calcLocation = function (v) {
    $scope.data.newVillage = false;
    console.log("SINGLE:", v);
  };

  $scope.villageFilter = function (village) {
    var sector_id = $scope.data.sector_id;
    return $scope.model.location.data.some(function (l) {
      return l.sector_id === sector_id && l.village_id === village.id;
    });
  };

  $scope.formatTypeAhead = function () {
    return $scope.model ? $scope.model.village.get($scope.data.village_id).name : '';
  };
});
