angular.module('bhima.directives')
.directive('findConvention', [
  '$compile',
  'validate',
  'messenger',
  'appcache',
  function ($compile, validate, messenger, Appcache) {
    return {
      restrict: 'A',
      templateUrl : '/partials/templates/findconvention.tmpl.html',
      link : function(scope, element, attrs) {
        var dependencies = {}, conventionList = scope.conventionList = [];
        var searchCallback = scope[attrs.onSearchComplete];
        var cache = new Appcache('conventionSearchDirective');

        if (!searchCallback) { throw new Error('Convention Search directive must implement data-on-search-complete'); }

        dependencies.debtor_group = {
          required : true,
          query : {
            tables : {
              debitor_group : { columns : ['uuid', 'name', 'account_id', 'phone','email']}
            }
          }
        };

        scope.findConvention = {
          state: 'name',
          submitSuccess: false
        };

        var stateMap = {
          'name' : searchName,
        };

        //TODO Downloads all patients for now - this should be swapped for an asynchronous search
        validate.process(dependencies).then(findConvention);
        cache.fetch('cacheState').then(loadDefaultState);

        function findConvention(model) {
          scope.findConvention.model = model;
          extractMetaData(model.debtor_group.data);
          var conventions = extractMetaData(model.debtor_group.data);
          conventionList = scope.conventionList = angular.copy(conventions);
        }

        function searchName(value) {
          if (typeof(value)==='string') {
            return messenger.danger('Submitted an invalid convention');
          }
          scope.findConvention.debtor_group = value;
          searchCallback(value);
          scope.findConvention.submitSuccess = true;
        }

        function submitDebitorGroup (value) {
          stateMap[scope.findConvention.state](value);
        }

        function extractMetaData(conventionData) {

          conventionData.forEach(function(convention) {
            convention.name = convention.name;
          });
          return conventionData;
        }

        function validateNameSearch(value) {
          if (!value) { return true; }

          if (typeof(value) === 'string') {
            scope.findConvention.valid = false;
            return true;
          }
          scope.findConvention.valid = true;
        }

        function resetSearch() {
          scope.findConvention.valid = false;
          scope.findConvention.submitSuccess = false;
          scope.findConvention.debtor_group = '';
        }

        function updateState(newState) {
          scope.findConvention.state = newState;
          cache.put('cacheState', {state: newState});
        }

        // FIXME Configure component on this data being available, avoid glitching interface
        function loadDefaultState(defaultState) {
          if (defaultState) {
            scope.findConvention.state = defaultState.state;
            return;
          }
        }

        // Expose selecting a debtor to the module (probably a hack)(FIXME)
        //scope.findConvention.forceSelect = searchUuid;

        scope.validateNameSearch = validateNameSearch;
        scope.findConvention.refresh = resetSearch;
        scope.submitDebitorGroup = submitDebitorGroup;

        scope.findConvention.updateState = updateState;
      }
    };
  }
]);
