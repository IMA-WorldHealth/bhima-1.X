
/**
 * Ideally directive would supply a template and a link method seperately, this is a work around for 
 * not being able to template in ng-model, maybe there's a better way. Ironically more optimal than using 
 * ng-repeat, the number of location properties should never change.
 */
angular.module('bhima.directives')
.directive('locationSelect', ['appstate', 'connect', '$compile',  function (appstate, connect, $compile) {
  /* jshint unused : false */
  return {
    restrict : 'A',
    replace : true,
    transclue : true,
    // template : '<div></div>',
    link : function (scope, element, attrs) {
      
      // TODO replace with correct scope management
      var namespace = scope.locationSelect = {};
      var session = namespace.session = {};
  
      
      // TODO rename variables etc. with useful names 
      var locationIndex = {};
      var locationConfig = namespace.locationConfig = {
        village : {
          dependency : 'sector',
          label : 'LOCATION.VILLAGE',
          column : 'name',
          id : 'village'
        },
        sector : {
          dependency : 'province',
          label : 'LOCATION.SECTOR',
          column : 'name',
          id : 'sector'
        }, province : {
          dependency : 'country',
          label : 'LOCATION.PROVINCE',
          column : 'name',
          id : 'province'
        },
        country : {
          dependency : null,
          label : 'LOCATION.COUNTRY',
          column : 'country_en',
          id : 'country'
        }
      };
      var locationStore = namespace.locationStore = {};
      appstate.register('project', settup);

      function settup(project) {
        console.log('settup');
        indexLocationDependencies();
        defineLocationRequests();
      
        var template = generateTemplate('locationConfig');
        console.log('tmpl', template);
        element.replaceWith($compile(generateTemplate('locationConfig'))(scope));
        
        fetchInitialLocation(project.location_id)
        .then(initialiseLocation);
      }

      function fetchInitialLocation(villageUuid) {
        return connect.fetch('/location/' + villageUuid);
      }

      function initialiseLocation(defaultLocation) {
        defaultLocation = defaultLocation[0];

        // Populate initial values (enterprise default)
        Object.keys(locationConfig).forEach(function (key) {
          locationStore[key] = {model : {}, value : {}};
          // modelMap.push(locationStore[key].value);
          locationStore[key].value = defaultLocation[formatKeyId(key)];

        });

        // Initial request, update config with no dependency
        fetchLocationData(lookupDependency(null), null);
      }

      // function updateLocation(key, uuidDependency) {
        // fetchLocationData(key, uuidDependency)
        // .then(function (data) {
          // return assignLocationData(key, data);
        // });
      // }

      function fetchLocationData(key, uuidDependency) {
        var config = locationConfig[key];
        var model = locationStore[key].model;

        // Conditions
        var requiredDependencyFailed = !uuidDependency && config.requires;
        
        if (requiredDependencyFailed) {
          
          // Clear results and stop propegation 
          model = { data : [] };
          if (config.dependency) {
            fetchLocationData(config.dependency, null);
          }
          return ;
        }
        
        if (config.dependency) {
          config.request.where = [key + '.' + formatKeyId(config.dependency) + '=' + uuidDependency];
        }

        // TODO Refactor : fetch and assign data from one function, each method 
        // responsible for only one thing
        connect.req(config.request).then(function (result) {

          
          console.log('[locationSelect] [fetchLocationData] Got data', result);
          return assignLocationData(key, result);
        });
      }

      function assignLocationData(key, result) {
        var currentLocationValue, invalidCurrentLocation, locationsFound;
        var store = locationStore[key];
        var requiresCurrentKey = lookupDependency(key);
      
        store.model = result;
        currentLocationValue = store.value;

        // Conditions 
        invalidCurrentLocation = !angular.isDefined(store.model.get(store.value));
        locationsFound = store.model.data.length;

        if (invalidCurrentLocation) {
          
          // Select default value if there are any 
          if (locationsFound) {
            currentLocationValue = store.value = store.model.data[0];
          }
        }

        //console.log('[assignLocationData][' + key + '] currentLocationValue', currentLocationValue);
        
        // Call any configuration that requires on this key
        if (requiresCurrentKey) {
          fetchLocationData(requiresCurrentKey, currentLocationValue);
        }
      }

      function indexLocationDependencies() {
        Object.keys(locationConfig).forEach(function (key) {
          locationIndex[locationConfig[key].dependency] = key;
        });
      }
      
      function defineLocationRequests() {
        Object.keys(locationConfig).forEach(function (key) {
          var config = locationConfig[key];
          var request = {
            identifier : 'uuid',
            tables : {},
            order : [config.column]
          };
          request.tables[key] = {
            columns : ['uuid', config.column]
          };
          
          if (config.dependency) {
            request.tables[key].columns.push(formatKeyId(config.dependency));
          }
          config.request = request;
        });
      }
    
      function lookupModel(key) { 
        console.log("lookupModel CALLED");
        return locationStore[key].model || {};
      }

      // Search will only ever have to hit 4 elements, convenience method
      function lookupDependency(currentKey) {
        
        // return locationConfig[locationIndex[currentKey]];
        return locationIndex[currentKey];
      }

      function formatKeyId(key) {
        var uuidSuffix = '_uuid';
        return key.concat(uuidSuffix);
      }

      function generateTemplate(configLabel) { 
        var config = namespace[configLabel]; 
        var directiveStructure = "<div>{{TEMPLATE_COMPONENTS}}</div>";
        var compile = "";

        // Such meta templating
        var componentStructure = '<div class="form-group"><label for="location-select-<%CONFIGID%>" class="control-label">{{<%CONFIGLABEL%> | translate}}</label><div class="pull-right"><span class="glyphicon glyphicon-globe"></span> {{locationStore.<%CONFIGID%>.data.length}}</div><select ng-disabled="locationSelect.session.locationSearch" ng-model="locationRelationship.<%CONFIGID%>.value" ng-options="<%CONFIGID%>.uuid as <%CONFIGID%>.<%CONFIGCOLUMN%> for <%CONFIGID%> in locationStore.<%CONFIGID%>.data | orderBy : \'name\'" ng-change="updateLocation(\'<%CONFIGDEPEND%>\', locationRelationship.<%CONFIGID%>.value)" class="form-bhima" id="location-select-<%CONFIGID%>"></select></div>';

        // var initialTemplate =
        var templateString = "";
        var configurationList = Object.keys(config).reverse();
        configurationList.forEach(function (key) { 
          var configObject = config[key];
          var component = componentStructure;
                    
          component = component.replace(/<%CONFIGID%>/g, configObject.id);
          component = component.replace(/<%CONFIGLABEL%>/g, configObject.label);
          component = component.replace(/<%CONFIGCOLUMN%>/g, configObject.column);
          component = component.replace(/<%CONFIGDEPEND%>/g, lookupDependency(key));
          compile = compile.concat(component);
        });

        return compile; 
      }

      namespace.lookupModel = lookupModel;
    }
  };
}]);
