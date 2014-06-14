angular.module('bhima.directives')
.directive('findConvention', [
  '$compile',
  'validate',
  'messenger',
  'appcache',
  function ($compile, validate, messenger, Appcache) {
    return {
      restrict: 'A',
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

        var template =
          '<div id=\'findConvention\' class=\'panel panel-default\' ng-class="{\'panel-success\': findConvention.valid, \'panel-danger\': findConvention.valid===false}">'+ '  <div class=\'panel-heading\'>'+
          '    <div ng-switch=\'findConvention.submitSuccess\'>'+
          '     <div ng-switch-when=\'false\'>'+
          '       <span class=\'glyphicon glyphicon-search\'></span> {{ \'CFIND.TITLE\' | translate }}'+
          '       <div class=\'pull-right\'>'+
          '         <a id=\'findByName\' ng-class="{\'link-selected\': findConvention.state===\'name\'}" ng-click=\'findConvention.updateState("name")\' class=\'patient-find\'><span class=\'glyphicon glyphicon-user\'></span> {{ \'CFIND.SEARCH\' | translate }} </a>'+
          '       </div>'+
          '     </div>'+
          '     <div ng-switch-when=\'true\'>'+
          '       <!-- Style hack -->'+
          '       <span style=\'margin-right: 5px;\' class=\'glyphicon glyphicon-user\'> </span> {{findConvention.debtor_group.name}}'+
          '       <div class=\'pull-right\'>'+
          '         <span ng-click=\'findConvention.refresh()\' class=\'glyphicon glyphicon-repeat\'></span>'+
          '       </div>'+
          '     </div>'+
          '    </div>'+
          '  </div>'+
          '  <div class=\'panel-body find-collapse\' ng-show=\'!findConvention.submitSuccess\'>'+
          '    <div ng-switch on=\'findConvention.state\'>'+
          '      <div ng-switch-when=\'name\'>'+
          '        <div class=\'input-group\'>'+
          '          <input '+
          '          id=\'findSearch\' ' +
          '          type=\'text\' '+
          '          ng-model=\'findConvention.selectedConvention\' '+
          '          typeahead=\'convention as convention.name for convention in conventionList | filter:$viewValue | limitTo:8\' '+
          '          placeholder=\'{{ \'CFIND.PLACEHOLDER\' | translate }}\' ' +
          '          typeahead-on-select=\'loadDebitorGroup(debitor_group.uuid)\' '+
          '          typeahead-template-url=\'debitorGroupListItem.html\''+
          '          class=\'form-bhima\' '+
          '          size=\'25\'>'+
          '          <span class=\'input-group-btn\'> '+
          '            <button id=\'submitSearch\' ng-disabled=\'validateNameSearch(findConvention.selectedConvention)\' ng-click=\'submitDebitorGroup(findConvention.selectedConvention)\' class=\'btn btn-default btn-sm\'> {{ \'FORM.SUBMIT\' | translate }}</button>'+
          '          </span>'+
          '        </div>'+
          '      </div> <!-- End searchName component -->'+
          '    </div>'+
          '  </div>'+
          '</div>';

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

        // Expose selecting a debtor to the module (probabl a hack)(FIXME)
        //scope.findConvention.forceSelect = searchUuid;

        scope.validateNameSearch = validateNameSearch;
        scope.findConvention.refresh = resetSearch;
        scope.submitDebitorGroup = submitDebitorGroup;

        scope.findConvention.updateState = updateState;
        element.replaceWith($compile(template)(scope));
      }
    };
  }
]);
