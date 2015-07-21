angular.module('bhima.directives')
.directive('findPatient', ['$compile', '$http', 'validate', 'messenger', 'appcache', function($compile, $http, validate, messenger, AppCache) {
  return {
    restrict: 'AE',
    templateUrl : 'partials/templates/findpatient.tmpl.html',
    scope : {
      callback : '&onSearchComplete',
      enableRefresh : '=',
    },
    link : function(scope, element, attrs) {
      var dependencies = {},
          cache = new AppCache('patientSearchDirective');

      var session = scope.session = {};

      session.state = 'name'; // 'name || 'uuid'
      session.submitted = false;
      session.valid = null;

      // calls bhima API for a patient by uuid
      function uuidSearch(uuid) {
        var url = '/patient/search/';
        return $http.get(url + uuid);
      }

      // matches the patient's name via SOUNDEX()
      function fuzzyNameSearch(text) {
        var url = '/patient/fuzzy/';
        return $http.get(url + text)
        .then(function (response) {
          console.log('Got response:', response);

          response.data.results.map(function (item) {
            return item.first_name + ' ' + item.last_name;
          });

        });
      }
      
      function toggleSearch(s) {
        session.method = s;
      }

      // expose to view
      scope.uuidSearch = uuidSearch;
      scope.fuzzyNameSearch = fuzzyNameSearch;
      scope.toggleSearch = toggleSearch;


      scope.findPatient = {
        state : 'name',
        submitSuccess : false,
        enableRefresh : scope.enableRefresh
      };

      // init the module
      cache.fetch('state')
      .then(loadDefaultState);

      function searchUuid(value) {
        dependencies.debtor.query.where = [
          'patient.uuid=' + value
        ];
        validate.refresh(dependencies, ['debtor']).then(handleIdRequest);
      }

      // TODO should this be temporary?
      function parseId(idString) {
        var codeLength = 3, namespacedId = {};

        // Current format VarChar(3):Int
        namespacedId.projectCode = idString.substr(0, codeLength);
        namespacedId.reference = idString.substr(codeLength);

        // console.log(namespacedId);
        if (!namespacedId.projectCode || !namespacedId.reference) { return null; }
        if (isNaN(Number(namespacedId.reference))) { return null; }

        // Ignore case temporary fix
        // FIXME MySQL request is not case sensitive - only the get on a
        //       model - this should be leveraged to not required uppercase
        namespacedId.projectCode = namespacedId.projectCode.toUpperCase();
        return namespacedId;
      }

      function handleIdRequest(model) {
        var debtor = scope.findPatient.debtor = extractMetaData(model.debtor.data)[0];
        //Validate only one debtor matches
        if (!debtor) {
          return messenger.danger('Received invalid debtor, unknown');
        }
        scope.findPatient.valid = true;
        scope.callback(debtor);
        scope.findPatient.submitSuccess = true;
      }

      function extractMetaData(patientData) {

        patientData.forEach(function(patient) {

          // Searchable name
          patient.name = patient.first_name + ' ' + patient.last_name;

          // Age - naive quick method, not a priority to calculate the difference between two dates
          patient.age = getAge(patient.dob);

          // Human readable ID
          // FIXME This should be a select CONCAT() from MySQL
          patient.hr_id = patient.abbr.concat(patient.reference);
        });

        return patientData;
      }

      // naive quick method to calculate the difference between two dates
      function getAge(date) {
        var current = new Date(),
            dob = (typeof date === 'object') ? date : new Date(date);
        
        return current.getFullYear() - dob.getFullYear() - Math.round(current.getMonth() / 12 + dob.getMonth() / 12);
      }

      function validateNameSearch(value) {
        if (!value) { return true; }

        if (typeof(value) === 'string') {
          scope.findPatient.valid = false;
          return true;
        }
        scope.findPatient.valid = true;
      }

      function resetSearch() {
        scope.findPatient.valid = null;
        scope.findPatient.submitSuccess = false;
        scope.findPatient.selectedDebtor = null;
        scope.findPatient.debtorId = null;
        scope.findPatient.debtor = '';
      }

      function updateState(newState) {
        scope.findPatient.state = newState;
        cache.put('state', { state: newState });
      }

      // FIXME Configure component on this data being available, avoid glitching interface
      function loadDefaultState(defaultState) {
        if (defaultState) {
          scope.findPatient.state = defaultState.state;
          return;
        }
      }

      scope.validateNameSearch = validateNameSearch;
      scope.findPatient.refresh = resetSearch;
      scope.findPatient.updateState = updateState;
    }
  };
}]);
