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

      var session = scope.session = {},
          input = scope.input = {};

      session.state = 'name'; // 'name || 'uuid'
      session.submitted = false;
      session.valid = null;

      // calls bhima API for a patient by hospital reference
      // (e.g. HBB123)
      function searchReference(ref) {
        var url = '/patient/search/reference/';
        $http.get(url + ref)
        .success(selectPatient)
        .error(function (err) {
          console.error(err); 
        })
        .finally();
      }

      // matches the patient's name via SOUNDEX()
      function fuzzyNameSearch(text) {
        var url = '/patient/search/fuzzy/';
        return $http.get(url + text.toLowerCase())
        .then(function (response) {
          return response.data;
        });
      }

      // make a pretty label
      function fmtPatient(p) {
        return p ? p.first_name + ' ' + p.last_name + ' ' + p.middle_name : '';
      }

      // change the input type
      function toggleSearch(s) {
        session.state = s;
        saveState({ state : s });
      }

      // expose to view
      scope.searchReference = searchReference;
      scope.fuzzyNameSearch = fuzzyNameSearch;
      scope.toggleSearch = toggleSearch;
      scope.fmtPatient = fmtPatient;

      // init the module
      cache.fetch('state')
      .then(loadDefaultState);

      // this is called after $http requests are made,
      function selectPatient(patient) {
        scope.patient = patient;

        // flush input away
        scope.input = {};

        // show success ui response
        session.valid = true;
        session.submitted = true;

        // parse patient metadata
        patient.age = getAge(patient.dob);
        patient.name = fmtPatient(patient);

        // call the external $scope callback
        scope.callback({ patient : patient });
      }

      // naive quick method to calculate the difference between two dates
      function getAge(date) {
        var current = new Date(),
            dob = (typeof date === 'object') ? date : new Date(date);

        return current.getFullYear() - dob.getFullYear() - Math.round(current.getMonth() / 12 + dob.getMonth() / 12);
      }

      // value is the selected typeahead model
      function validateNameSearch(value) {
        if (!value) { return true; }

        if (typeof value === 'string') {
          session.valid = false;
          return true;
        }

        session.valid = true;
      }

      function refresh() {
        session.submitted = false;
        session.valid = null;
        input = {};
      }

      function loadDefaultState(dstate) {
        if (dstate) { toggleSearch(dstate.state); }
      }

      // save the directive state to appcache
      function saveState(dstate) {
        cache.put('state', dstate);
      }

      scope.validateNameSearch = validateNameSearch;
      scope.refresh = refresh;
      scope.selectPatient = selectPatient;
    }
  };
}]);
