angular.module('bhima.directives')
.directive('findPatient', ['$compile', 'validate', 'messenger', 'appcache', function($compile, validate, messenger, Appcache) {
  return {
    restrict: 'A',
    link : function(scope, element, attrs) {
      var dependencies = {}, debtorList = scope.debtorList = [];
      var searchCallback = scope[attrs.onSearchComplete];
      var cache = new Appcache('patientSearchDirective');

      if(!searchCallback) { throw new Error('Patient Search directive must implement data-on-search-complete'); }

      dependencies.debtor = {
        required : true,
        query : {
          tables : {
            patient : {columns : ['uuid', 'project_id', 'debitor_uuid', 'first_name', 'last_name', 'sex', 'dob', 'origin_location_id', 'reference']},
            project : { columns : ['abbr'] },
            debitor : { columns : ['text']},
            debitor_group : { columns : ['account_id', 'price_list_uuid', 'is_convention']}
          },
          join : [
            'patient.debitor_uuid=debitor.uuid',
            'debitor.group_uuid=debitor_group.uuid',
            'patient.project_id=project.id'
          ]
        }
      };

      dependencies.project = {
        query : {
          identifier : 'abbr',
          tables : {
            project : { columns : ['abbr', 'id'] }
          }
        }
      };

      scope.findPatient = {
        state : 'id',
        submitSuccess : false,
        enableRefresh : attrs.enableRefresh || true
      };

      var template =
      '<div id="findPatient" class="panel panel-default square" ng-class="{\'panel-success\': findPatient.valid, \'panel-danger\': findPatient.valid===false}">'+ '  <div class="panel-heading square">'+
      '    <div ng-switch on="findPatient.submitSuccess">'+
      '     <div ng-switch-when="false">'+
      '       <span class="glyphicon glyphicon-search"></span> {{ "FIND.TITLE" | translate }}'+
      '       <div class="pull-right">'+
      '         <a id="findById" style="cursor:pointer;" ng-class="{\'link-selected\': findPatient.state===\'id\'}" ng-click="findPatient.updateState(\'id\')" class="patient-find"><span class="glyphicon glyphicon-pencil"></span> {{ "FIND.ENTER_DEBTOR_ID" | translate }} </a>'+
      '         <a id="findByName" style="cursor:pointer;" ng-class="{\'link-selected\': findPatient.state===\'name\'}" ng-click="findPatient.updateState(\'name\')" class="patient-find"><span class="glyphicon glyphicon-user"></span> {{ "FIND.SEARCH" | translate }} </a>'+
      '       </div>'+
      '     </div>'+
      '     <div ng-switch-when="true">'+
      '       <!-- Style hack -->'+
      '       <span style="margin-right: 5px;" class="glyphicon glyphicon-user"> </span> {{findPatient.debtor.name}} <small>({{findPatient.debtor.sex}} {{findPatient.debtor.age}})</small>'+
      '       <div class="pull-right" ng-if="findPatient.enableRefresh">'+
      '         <span ng-click="findPatient.refresh()" class="glyphicon glyphicon-repeat"></span>'+
      '       </div>'+
      '     </div>'+
      '    </div>'+
      '  </div>'+
      '  <div class="panel-body find-collapse" ng-show="!findPatient.submitSuccess">'+
      '    <div ng-switch on="findPatient.state">'+
      '      <div ng-switch-when="name">'+
      '        <div class="input-group">'+
      '          <input '+
      '          id="findSearch" ' +
      '          type="text" '+
      '          ng-model="findPatient.selectedDebtor" '+
      '          typeahead="patient as patient.name for patient in debtorList | filter:$viewValue | limitTo:8" '+
      '          placeholder=\'{{ "FIND.PLACEHOLDER" | translate }}\' ' +
      '          typeahead-on-select="loadDebitor(debitor.id)" '+
      '          typeahead-template-url="debtorListItem.html"'+
      '          class="form-bhima" '+
      '          size="25">'+
      '          <span class="input-group-btn"> '+
      '            <button id="submitSearch" ng-disabled="validateNameSearch(findPatient.selectedDebtor)" ng-click="submitDebtor(findPatient.selectedDebtor)" class="btn btn-default btn-sm"> {{ "FORM.SUBMIT" | translate }}</button>'+
      '          </span>'+
      '        </div>'+
      '      </div> <!-- End searchName component -->'+
      '      <div ng-switch-when="id">'+
      '        <div class="input-group">'+
      '          <input '+
      '            type="text"'+
      '            ng-model="findPatient.debtorId"'+
      '            class="form-bhima"'+
      '            placeholder=\'{{ "FIND.PATIENT_ID" | translate }}\'>'+
      '          <span class="input-group-btn">'+
      '            <button ng-click="submitDebtor(findPatient.debtorId)" class="btn btn-default btn-sm"> {{ "FORM.SUBMIT" | translate }} </button>'+
      '          </span>'+
      '        </div>'+
      '      </div>'+
      '    </div> <!--End find patient switch -->'+
      '  </div>'+
      '</div>';

      var stateMap = {
        'name' : searchName,
        'id' : searchId
      };

      //TODO Downloads all patients for now - this should be swapped for an asynchronous search
      validate.process(dependencies).then(findPatient);
      cache.fetch('cacheState').then(loadDefaultState);

      function findPatient(model) {
        scope.findPatient.model = model;
        extractMetaData(model.debtor.data);
        var patients = extractMetaData(model.debtor.data);
        debtorList = scope.debtorList = angular.copy(patients);
      }

      function searchName(value) {
        if(typeof(value)==='string') return messenger.danger('Submitted an invalid debtor');
        scope.findPatient.debtor = value;
        searchCallback(value);
        scope.findPatient.submitSuccess = true;
      }

      function searchId(value) {
        var id = parseId(value), project;

        if(!id) return messenger.danger('Cannot parse patient ID');
        project = scope.findPatient.model.project.get(id.projectCode);

        if(!project) return messenger.danger('Cannot find project \'' + id.projectCode + '\'');

        dependencies.debtor.query.where = [
          "patient.project_id=" + project.id,
          "AND",
          "patient.reference=" + id.reference
        ];
        validate.refresh(dependencies, ['debtor']).then(handleIdRequest, handleIdError);
      }

      function searchUuid(value) {
        dependencies.debtor.query.where = [
          "patient.uuid=" + value
        ];
        validate.refresh(dependencies, ['debtor']).then(handleIdRequest, handleIdError);
      }

      // TODO should this be temporary?
      function parseId(idString) {
        var codeLength = 3, namespacedId = {};

        // Current format VarChar(3):Int
        namespacedId.projectCode = idString.substr(0, codeLength);
        namespacedId.reference = idString.substr(codeLength);

        // console.log(namespacedId);
        if(!namespacedId.projectCode || !namespacedId.reference) return null;
        if(isNaN(Number(namespacedId.reference))) return null;

        // Ignore case temporary fix
        // FIXME MySQL request is not case sensitive - only the get on a
        //       model - this should be leveraged to not required uppercase
        namespacedId.projectCode = namespacedId.projectCode.toUpperCase();
        return namespacedId;
      }

      function handleIdRequest(model) {
        var debtor = scope.findPatient.debtor = extractMetaData(model.debtor.data)[0];
        console.log('downloaded', model);
        //Validate only one debtor matches
        if(!debtor) return messenger.danger("Received invalid debtor, unknown");
        scope.findPatient.valid = true;
        searchCallback(debtor);
        scope.findPatient.submitSuccess = true;
      }

      function handleIdError(error) {
        scope.findPatient.valid = false;
        console.log(error);

        //Naive implementation
        if(error.validModelError) {
          if(error.flag === 'required') {
            messenger.danger('Patient record cannot be found');
          }
        }
      }

      function submitDebtor(value) {
        stateMap[scope.findPatient.state](value);
      }

      function extractMetaData(patientData) {

        patientData.forEach(function(patient) {
          var currentDate = new Date();
          var patientDate = new Date(patient.dob);

          //Searchable name
          patient.name = patient.first_name + ' ' + patient.last_name;

          //Age - naive quick method, not a priority to calculate the difference between two dates
          patient.age = currentDate.getFullYear() - patientDate.getFullYear() - Math.round(currentDate.getMonth() / 12 + patientDate.getMonth() / 12) ;

          //Human readable ID
          // FIXME This should be a select CONCAT() from MySQL
          patient.hr_id = patient.abbr.concat(patient.reference);
          //console.log(patient.hr_id);
        });
        return patientData;
      }

      function validateNameSearch(value) {
        if(!value) return true;

        if(typeof(value)==='string') {
          scope.findPatient.valid = false;
          return true;
        }
        scope.findPatient.valid = true;
      }

      function resetSearch() {
        scope.findPatient.valid = false;
        scope.findPatient.submitSuccess = false;
        scope.findPatient.debtor = "";
      }

      function updateState(newState) {
        scope.findPatient.state = newState;
        cache.put('cacheState', {state: newState});
      }

      // FIXME Configure component on this data being available, avoid glitching interface
      function loadDefaultState(defaultState) {
        if(defaultState) return scope.findPatient.state = defaultState.state;
      }

      // Expose selecting a debtor to the module (probabl a hack)(FIXME)
      scope.findPatient.forceSelect = searchUuid;

      scope.validateNameSearch = validateNameSearch;
      scope.findPatient.refresh = resetSearch;
      scope.submitDebtor = submitDebtor;

      scope.findPatient.updateState = updateState;
      element.replaceWith($compile(template)(scope));
    }
  };
}]);
