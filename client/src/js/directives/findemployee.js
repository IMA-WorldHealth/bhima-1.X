angular.module('bhima.directives')
.directive('findEmployee', ['$compile', 'validate', 'messenger', 'appcache', function($compile, validate, messenger, Appcache) {
  return {
    restrict: 'A',
    link : function(scope, element, attrs) {
      var dependencies = {}, employeeList = scope.employeeList = [];
      var searchCallback = scope[attrs.onSearchComplete];
      var cache = new Appcache('employeeSearchDirective');

      if (!searchCallback) { throw new Error('Employee Search directive must implement data-on-search-complete'); }

      dependencies.employee = {
        required : true,
        query : 'employee_list/'       
      };

      dependencies.project = {
        query : {
          identifier : 'abbr',
          tables : {
            project : { columns : ['abbr', 'id'] }
          }
        }
      };

      scope.findEmployee = {
        state : 'name',
        submitSuccess : false,
        enableRefresh : attrs.enableRefresh || true
      };

      var template =
        '<div id=\'findEmployee\' class=\'panel panel-default square\' ng-class="{\'panel-success\': findEmployee.valid, \'panel-danger\': findEmployee.valid===false}">' +
        '  <div class=\'panel-heading square\'>' +
        '    <div ng-switch=\'findEmployee.submitSuccess\'>' +
        '     <div ng-switch-when=\'false\'>' +
        '       <span class=\'glyphicon glyphicon-search\'></span> {{ \'EFIND.TITLE\' | translate }}' +
        '     </div>' +
        '     <div ng-switch-when=\'true\'>' +
        '       <!-- Style hack -->' +
        '       <span style=\'margin-right: 5px;\' class=\'glyphicon glyphicon-user\'> </span> {{findEmployee.employee.name}} <small>({{findEmployee.employee.sexe}})</small>' +
        '       <div class=\'pull-right\' ng-if=\'findEmployee.enableRefresh\'>' +
        '         <span ng-click=\'findEmployee.refresh()\' class=\'glyphicon glyphicon-repeat\'></span>' +
        '       </div>' +
        '     </div>' +
        '    </div>' +
        '  </div>' +
        '  <div class=\'panel-body find-collapse\' ng-show=\'!findEmployee.submitSuccess\'>' +
        '    <div ng-switch on=\'findEmployee.state\'>' +
        '      <div ng-switch-when=\'name\'>' +
        '        <div class=\'input-group\'>' +
        '          <input ' +
        '          id=\'findSearch\' ' +
        '          type=\'text\' ' +
        '          ng-model=\'findEmployee.selectedEmployee\' ' +
        '          typeahead=\'employee as employee.name for employee in employeeList | filter:$viewValue | limitTo:8\' ' +
        '          placeholder=\'{{ "EFIND.PLACEHOLDER" | translate }}\' ' +
        '          typeahead-on-select=\'loadEmployee(employee.id)\' ' +
        '          typeahead-template-url=\'employeeListItem.html\'' +
        '          class=\'form-bhima\' ' +
        '          size=\'25\'>' +
        '          <span class=\'input-group-btn\'> '+
        '            <button id=\'submitSearch\' ng-disabled=\'validateNameSearch(findEmployee.selectedEmployee)\' ng-click=\'submitEmployee(findEmployee.selectedEmployee)\' class=\'btn btn-default btn-sm\'> {{ \'FORM.SUBMIT\' | translate }}</button>' +
        '          </span>' +
        '        </div>' +
        '      </div> <!-- End searchName component -->' +
        '      <div ng-switch-when=\'id\'>' +
        '        <div class=\'input-group\'>' +
        '          <input ' +
        '            type=\'text\'' +
        '            ng-model=\'findEmployee.employeeId\'' +
        '            class=\'form-bhima\'' +
        '            placeholder=\'{{ "EFIND.ENTER_EMPLOYEE_ID" | translate }}\'>' +
        '          <span class=\'input-group-btn\'>' +
        '            <button ng-click=\'submitEmployee(findEmployee.employeeId)\' class=\'btn btn-default btn-sm\'> {{ \'FORM.SUBMIT\' | translate }} </button>' +
        '          </span>' +
        '        </div>' +
        '      </div>' +
        '    </div> <!--End find patient switch -->' +
        '  </div>' +
        '</div>';

      var stateMap = {
        'name' : searchName,
        'id' : searchId
      };

      //TODO Downloads all patients for now - this should be swapped for an asynchronous search
      validate.process(dependencies).then(findEmployee);
      cache.fetch('cacheState').then(loadDefaultState);

      function findEmployee(model) {
        scope.findEmployee.model = model;
        // extractMetaData(model.employee.data);
        var employees = extractMetaData(model.employee.data);
        employeeList = scope.employeeList = angular.copy(employees);
        console.log(employeeList);
      }

      function searchName(value) {
        if (typeof(value) === 'string') {
          return messenger.danger('Submitted an invalid employee');
        }
        scope.findEmployee.employee = value;
        searchCallback(value);
        scope.findEmployee.submitSuccess = true;
      }

      function searchId(value) {
        var id = value, project;        

        if (!id) {
          return messenger.danger('Cannot parse employee ID');
        }

        dependencies.employee.query.where = [
          'employee.id=' + id
        ];

        validate.refresh(dependencies, ['employee']).then(handleIdRequest, handleIdError);
      }
      
      function handleIdRequest(model) {
        console.log('le model refresh', model);
        var employee = scope.findEmployee.employee = extractMetaData(model.employee.data)[0];
        if (!employee) {
          return messenger.danger('Received invalid employee, unknown');
        }
        scope.findEmployee.valid = true;
        searchCallback(employee);
        scope.findEmployee.submitSuccess = true;
      }

      function handleIdError(error) {
        scope.findEmployee.valid = false;
        console.log(error);

        //Naive implementation
        if (error.validModelError) {
          if (error.flag === 'required') {
            messenger.danger('Employee record cannot be found');
          }
        }
      }

      function submitEmployee(value) {
        stateMap[scope.findEmployee.state](value);
      }

      function extractMetaData(employeeData) {

        employeeData.forEach(function(employee) {
          employee.name = employee.prenom + ' ' + employee.name;
          
        });
        return employeeData;
      }

      function validateNameSearch(value) {
        if (!value) { return true; }

        if (typeof(value) === 'string') {
          scope.findEmployee.valid = false;
          return true;
        }
        scope.findEmployee.valid = true;
      }

      function resetSearch() {
        scope.findEmployee.valid = false;
        scope.findEmployee.submitSuccess = false;
        scope.findEmployee.employee = '';
      }

      function updateState(newState) {
        scope.findEmployee.state = newState;
        cache.put('cacheState', {state: newState});
      }

      // FIXME Configure component on this data being available, avoid glitching interface
      function loadDefaultState(defaultState) {
        if (defaultState) {
          scope.findEmployee.state = defaultState.state;
          return;
        }
      }

      scope.validateNameSearch = validateNameSearch;
      scope.findEmployee.refresh = resetSearch;
      scope.submitEmployee = submitEmployee;

      scope.findEmployee.updateState = updateState;
      element.replaceWith($compile(template)(scope));
    }
  };
}]);
