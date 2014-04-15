// js/directives/directives.js

(function (angular) {
  'use strict';

  angular.module('kpk.directives', [])

    .directive('ngFocus', ['$parse', function ($parse) {
      return function(scope, element, attr) {
        var fn = $parse(attr.ngFocus);
        element.bind('focus', function (event) {
          scope.$apply(function () {
            fn(scope, {$event:event});
          });
        });
      };
    }])

    .directive('ngBlur', ['$parse', function ($parse) {
      return function(scope, element, attr) {
        var fn = $parse(attr.ngBlur);
        element.bind('blur', function (event) {
          scope.$apply(function () {
            fn(scope, {$event:event});
          });
        });
      };
    }])

    .directive('selectSearch', ['$compile', function($compile) {
      return {
        link: function(scope, element, attrs) {

        }
      };
    }])

    .directive('loadingIndicator', ['requestNotificationChannel', '$timeout', function (channel, $timeout) {
      return {
        restrict : 'EA',
        link : function (scope, element, attrs) {
          element.hide();

          var startRequestHandler = function() {
            // got the request start notification, show the element
            element.show();
          };

          var endRequestHandler = function() {
            // got the request start notification, show the element
            //$timeout(function () {
            //  element.hide();
            //}, 5000);
          };

          channel.onRequestStarted(scope, startRequestHandler);

          channel.onRequestEnded(scope, endRequestHandler);
        }
      };
    }])

    .directive('reportGroupCompile', ['$compile', function($compile) {

      //TODO Currently tries too hard to use generic templating and ends up being a tightly coupled (slow) operation
      //replace with functions that build array templates and join()
      return {
        restrict: 'A',
        link: function(scope, element, attrs) {
          var built = false, template = [];
          var groupModel = attrs.groupModel, tableDefinition = attrs.tableDefinition;
          var accountRowTemplate = "<tr><td style='text-align: right;'>%d</td><td %s>%s</td>%s</tr>";
          var accountTotalTemplate = "<tr><td></td><td %s'>%s</td>%s</tr>";

          if(groupModel && tableDefinition) {
            scope.$watch(groupModel, function(nval, oval) {
              if(!built && nval.length > 0) buildTable(nval); //Remove directive $watch
            }, true);
          }

          function buildTable(data) {
            built = true;
            parseGroup(data);

            //TODO append to element vs replace (attach to tbody)
            element.replaceWith($compile(template.join(''))(scope));
          }

          function parseGroup(accountGroup) {
            accountGroup.forEach(function(account) {
              var detail = account.detail, style = buildAccountStyle(detail);

              //Row for group detail
              template.push(printf(accountRowTemplate, detail.account_number, style, detail.account_txt, buildAccountColumns(detail, false)));
              if(!account.accounts) return;

              //Group children
              parseGroup(account.accounts);

              //Total row
              template.push(printf(accountTotalTemplate, printf('style="padding-left: %dpx; font-weight: bold;"', detail.depth * 30), "Total " + detail.account_txt, buildAccountColumns(detail, true)));
            });
          }

          function buildAccountStyle(detail) {

            //FIXME hardcoded account type definition
            var styleTemplate = "", colspanTemplate = "", classTemplate = "", title = (detail.account_type_id === 3);

            styleTemplate = printf('style="padding-left: %dpx;"', detail.depth * 30);
            if(title) {
              colspanTemplate = printf('colspan="%d"', scope[tableDefinition].columns.length + 1);
              classTemplate = 'class="reportTitle"';
            }
            return printf('%s %s %s', styleTemplate, colspanTemplate, classTemplate);
          }

          function buildAccountColumns(detail, isTotal) {
            if(detail.account_type_id === 3 && !isTotal) return "";

            var columnTemplate = [], data = isTotal ? detail.total : detail;
            scope[tableDefinition].columns.forEach(function(column) {
              columnTemplate.push(printf('<td %s>{{%d | currency}}</td>', (isTotal ? 'style="font-weight: bold;"' : ''), data[column.key] || 0));
            });
            return columnTemplate.join('');
          }

          //Naive templating function
          function printf(template) {
            var typeIndex = [], tempTemplate = template, shift = 0;
            var replaceArguments = [];
            var types = {
              '%s' : '[object String]',
              '%d' : '[object Number]',
              '%l' : '[object Array]'
            };

            //read arguments - not sure how much 'use strict' aproves of this
            for(var i = 1; i < arguments.length; i += 1) {
              replaceArguments.push(arguments[i]);
            }

            Object.keys(types).forEach(function(matchKey) {
              var index = tempTemplate.indexOf(matchKey);
              while(index >= 0) {
                typeIndex.push({index: index, matchKey: matchKey});
                tempTemplate = tempTemplate.replace(matchKey, '');
                index = tempTemplate.indexOf(matchKey);
              }
            });

            typeIndex.sort(function(a, b) { return a.index > b.index; });
            typeIndex.forEach(function(replaceObj, index) {
              var targetArg = replaceArguments[index], replaceIndex = replaceObj.index + shift, matchKey = typeIndex[replaceIndex];
              if(Object.prototype.toString.call(targetArg) !== types[replaceObj.matchKey]) throw new Error("Argument " + targetArg + " is not " + types[replaceObj.matchKey]);
              template = template.replace(replaceObj.matchKey, targetArg);
              shift += targetArg.length;
            });
            return template;
          }
        }
      };
    }])

    .directive('reportGroup', ['$compile', function($compile) {
      return {
        restrict: 'A',
        link: function(scope, element, attrs) {
          var groupModel = attrs.groupModel;
          var template = [
            '<tr data-ng-repeat-start="group in ' + groupModel + '">',
            '<td style="text-align: right">{{group.detail.account_number}}</td>',
            '<td ng-class="{\'reportTitle\': group.detail.account_type_id==3}" ng-style="{\'padding-left\': group.detail.depth * 30 + \'px\'}">{{group.detail.account_txt}}</td>',
            '<td ng-repeat="column in tableDefinition.columns"><span ng-hide="group.detail.account_type_id==3">{{(group.detail[column.key] || 0) | currency}}</span></td>',
            '</tr>',
            '<tr ng-if="group.accounts" data-report-group data-group-model="group.accounts"></tr>',
            '<tr ng-if="group.detail.account_type_id == 3" data-ng-repeat-end><td></td><td ng-style="{\'padding-left\': group.detail.depth * 30 + \'px\'}"><em>Total {{group.detail.account_txt}}</em></td><td ng-repeat="column in tableDefinition.columns"><b>{{group.detail.total[column.key] | currency}}</b></td></tr>'
          ];

          if(attrs.groupModel){
            element.replaceWith($compile(template.join(''))(scope));
          }
        }
      };
    }])

    .directive('treeModel', ['$compile', 'appcache', function($compile, Appcache) {
      var MODULE_NAMESPACE = 'tree';
      var cache = new Appcache(MODULE_NAMESPACE);

      return {
        restrict: 'A',
        link: function (scope, element, attrs) {
          var treeId = attrs.treeId;
          var treeModel = attrs.treeModel;
          var nodeId = attrs.nodeId || 'id';
          var nodeLabel = attrs.nodeLabel || 'name';
          var nodeChildren = attrs.nodeChildren || 'children';

          var template =
            '<ul>' +
              '<li data-ng-repeat="node in ' + treeModel + '">' +
                '<i name="{{node.' + nodeLabel + '}}" ng-class="{\'glyphicon-folder-close collapsed\': node.' + nodeChildren + '.length && node.collapsed, \'glyphicon-folder-open expanded\': node.' + nodeChildren + '.length && !node.collapsed}" class="glyphicon" data-ng-click="' + treeId + '.selectNodeHead(node)"></i> ' +
                '<i class="normal glyphicon glyphicon-file" data-ng-hide="node.' + nodeChildren + '.length" data-ng-click="' + treeId + '.selectNodeHead(node)"></i> ' +
                '<span name="{{node.'  + nodeLabel + '}}" data-ng-class="node.selected" data-ng-click="' + treeId + '.selectNodeLabel(node)">{{node.' + nodeLabel + ' | translate }}</span>' +
                '<div data-ng-hide="node.collapsed" data-tree-id="' + treeId + '" data-tree-model="node.' + nodeChildren + '" data-node-id=' + nodeId + ' data-node-label=' + nodeLabel + ' data-node-children=' + nodeChildren + '></div>' +
              '</li>' +
            '</ul>';

          //Collapse by default
          if (scope.node) scope.node.collapsed = true;

          //Assign select/ collapse methods - should only occur once
          if (treeId && treeModel) {
            if (attrs.angularTreeview) {
              scope[treeId] = scope[treeId] || {};
              scope[treeId].selectNodeHead = scope[treeId].selectNodeHead || function (selectedNode) {

                // Select nodes without children
                if(!selectedNode.has_children) return scope[treeId].selectNodeLabel(selectedNode);

                selectedNode.collapsed = !selectedNode.collapsed;

                // Update cache
                cache.put(selectedNode.unit_id, {collapsed: selectedNode.collapsed});
              };
              scope[treeId].selectNodeLabel = scope[treeId].selectNodeLabel || function (selectedNode) {

                // Open nodes with children
                if (selectedNode.has_children) return scope[treeId].selectNodeHead(selectedNode);

                // Close previous node
                if (scope[treeId].currentNode && scope[treeId].currentNode.selected) {
                  scope[treeId].currentNode.selected = undefined;
                }

                // Select current (non-parent) node
                selectedNode.selected = 'selected';
                scope[treeId].currentNode = selectedNode;
              };
            }
            element.html('').append($compile(template)(scope));
          }
        }
      };
    }])

    .directive('findPatient', ['$compile', 'validate', 'messenger', 'connect', 'appcache', function($compile, validate, messenger, connect, Appcache) {
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
                patient : {columns : ["uuid", "project_id", "debitor_uuid", "first_name", "last_name", "sex", "dob", "origin_location_id", "reference"]},
                project : { columns : ["abbr"] },
                debitor : { columns : ["text"]},
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
                project : { columns : ["abbr", "id"] }
              }
            }
          };

          scope.findPatient = {
            state: 'id',
            submitSuccess: false
          };

          var template =
          '<div id="findPatient" class="panel panel-default" ng-class="{\'panel-success\': findPatient.valid, \'panel-danger\': findPatient.valid===false}">'+ '  <div class="panel-heading">'+
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
          '       <div class="pull-right">'+
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
          '          class="form-kapok" '+
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
          '            class="form-kapok"'+
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
    }])

    .directive('balanceCompile', ['$compile', function ($compile) {
      return {
        scope : {
          'cData' : '&'
        },
        link : function ($scope, element, attrs) {
          console.log(scope.cData);
          console.log('directive initialized');
        }
      };
    }])

    .directive('compile', ['$compile', function ($compile) {
      return function(scope, element, attrs) {
        scope.$watch(
          function(scope) {
            // watch the 'compile' expression for changes
            return scope.$eval(attrs.compile);
          },
          function(value) {
            // when the 'compile' expression changes
            // assign it into the current DOM
            element.html(value);

            // compile the new DOM and link it to the current
            // scope.
            // NOTE: we only compile .childNodes so that
            // we don't get into infinite loop compiling ourselves
            $compile(element.contents())(scope);
          }
        );
      };
    }])

    .directive('header', ['appstate', '$timeout', function (appstate, $timeout) {
      return {
        restrict: 'A',
        replace : true,
        transclude : true,
        template : '<header ng-cloak><span ng-transclude></span><span class="pull-right" style="font-size: .45em;"><div><strong>{{ "UTIL.PROJECT" | translate }}</strong></div><div>{{ project.abbr.toUpperCase() }} {{ project.name }}</div></span></header>',
        link : function (scope, element, attrs) {
          appstate.register('project', function (project) {
            $timeout(function () { scope.project = project; });
          });
        }
      };
    }])

    .directive('findConvention', ['$compile', 'validate', 'messenger', 'connect', 'appcache', function ($compile, validate, messenger, connect, Appcache) {
      return {
        restrict: 'A',
        link : function(scope, element, attrs) {
          var dependencies = {}, conventionList = scope.conventionList = [];
          var searchCallback = scope[attrs.onSearchComplete];
          var cache = new Appcache('conventionSearchDirective');

          if(!searchCallback) { throw new Error('Convention Search directive must implement data-on-search-complete'); }

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
            '<div id="findConvention" class="panel panel-default" ng-class="{\'panel-success\': findConvention.valid, \'panel-danger\': findConvention.valid===false}">'+ '  <div class="panel-heading">'+
            '    <div ng-switch on="findConvention.submitSuccess">'+
            '     <div ng-switch-when="false">'+
            '       <span class="glyphicon glyphicon-search"></span> {{ "CFIND.TITLE" | translate }}'+
            '       <div class="pull-right">'+
            '         <a id="findByName" ng-class="{\'link-selected\': findConvention.state===\'name\'}" ng-click="findConvention.updateState(\'name\')" class="patient-find"><span class="glyphicon glyphicon-user"></span> {{ "CFIND.SEARCH" | translate }} </a>'+
            '       </div>'+
            '     </div>'+
            '     <div ng-switch-when="true">'+
            '       <!-- Style hack -->'+
            '       <span style="margin-right: 5px;" class="glyphicon glyphicon-user"> </span> {{findConvention.debtor_group.name}}'+
            '       <div class="pull-right">'+
            '         <span ng-click="findConvention.refresh()" class="glyphicon glyphicon-repeat"></span>'+
            '       </div>'+
            '     </div>'+
            '    </div>'+
            '  </div>'+
            '  <div class="panel-body find-collapse" ng-show="!findConvention.submitSuccess">'+
            '    <div ng-switch on="findConvention.state">'+
            '      <div ng-switch-when="name">'+
            '        <div class="input-group">'+
            '          <input '+
            '          id="findSearch" ' +
            '          type="text" '+
            '          ng-model="findConvention.selectedConvention" '+
            '          typeahead="convention as convention.name for convention in conventionList | filter:$viewValue | limitTo:8" '+
            '          placeholder=\'{{ "CFIND.PLACEHOLDER" | translate }}\' ' +
            '          typeahead-on-select="loadDebitorGroup(debitor_group.uuid)" '+
            '          typeahead-template-url="debitorGroupListItem.html"'+
            '          class="form-kapok" '+
            '          size="25">'+
            '          <span class="input-group-btn"> '+
            '            <button id="submitSearch" ng-disabled="validateNameSearch(findConvention.selectedConvention)" ng-click="submitDebitorGroup(findConvention.selectedConvention)" class="btn btn-default btn-sm"> {{ "FORM.SUBMIT" | translate }}</button>'+
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
            if(typeof(value)==='string') return messenger.danger('Submitted an invalid convention');
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
            if(!value) return true;

            if(typeof(value)==='string') {
              scope.findConvention.valid = false;
              return true;
            }
            scope.findConvention.valid = true;
          }

          function resetSearch() {
            scope.findConvention.valid = false;
            scope.findConvention.submitSuccess = false;
            scope.findConvention.debtor_group = "";
          }

          function updateState(newState) {
            scope.findConvention.state = newState;
            cache.put('cacheState', {state: newState});
          }

          // FIXME Configure component on this data being available, avoid glitching interface
          function loadDefaultState(defaultState) {
            if(defaultState) return scope.findConvention.state = defaultState.state;
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
    }]);

})(angular);
