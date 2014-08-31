/**
 * Ideally directive would supply a template and a link method seperately, this is a work around for 
 * not being able to template in ng-model, maybe there's a better way. Ironically more optimal than using 
 * ng-repeat, the number of location properties should never change.
 *
 * 
 */
angular.module('bhima.directives')
.directive('locationSelect', ['appstate', 'connect', '$compile',  function (appstate, connect, $compile) {
  /* jshint unused : false */
  return {
    restrict : 'A',
    replace : true,
    transclue : true,
    link : function (scope, element, attrs) {
      
      var namespace = scope.locationSelect = {};
      
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

        indexLocationDependencies();
        defineLocationRequests();
      
        var template = generateTemplate('locationConfig');
        element.replaceWith($compile(template)(scope));
        
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

      function submitVillage(uuid) { 
        console.log('calling village callback with', uuid);
        return;
      }

      // function updateLocation(key, uuidDependency) {
        // fetchLocationData(key, uuidDependency)
        // .then(function (data) {
          // return assignLocationData(key, data);
        // });
      // }

      function fetchLocationData(key, uuidDependency) {
        var config = locationConfig[key];
        var model, requires; 
   
        // ng-change hack
        if (!angular.isDefined(key)) return;

        model = locationStore[key].model;
        requires = lookupDependency(key);
        
        // Conditions
        var requiredDependencyFailed = !uuidDependency && config.dependency;
       
        
        // Clear results and stop propegation 
        if (requiredDependencyFailed) {
          
          model = locationStore[key].model = { data : [] };

          if (requires) {

            fetchLocationData(requires, null);
          }
          return ;
        }
        
        if (config.dependency) {
          config.request.where = [key + '.' + formatKeyId(config.dependency) + '=' + uuidDependency];
        }

        // TODO Refactor : fetch and assign data from one function, each method 
        // responsible for only one thing
        connect.req(config.request).then(function (result) {

          
          return assignLocationData(key, result);
        });
      }

      function assignLocationData(key, result) {
        var currentLocationValue, validCurrentLocation, locationsFound;
        var store = locationStore[key];
        var requiresCurrentKey = lookupDependency(key);
      
        store.model = result;
        currentLocationValue = store.value;

        // Conditions 
        validCurrentLocation = angular.isDefined(store.model.get(store.value));
        locationsFound = store.model.data.length;
      
    
        
        
        if (!validCurrentLocation) store.value = null;
        if (locationsFound && !validCurrentLocation) store.value = store.model.data[0].uuid;
               
        // Call any configuration that requires on this key
        // Propegate
        if (requiresCurrentKey) {
          fetchLocationData(requiresCurrentKey, store.value);
        } else { 
          submitVillage(store.value);   
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
        var directiveStructure = '<div>{{TEMPLATE_COMPONENTS}}</div>';
        var compile = '';

        // Such meta templating
        var componentStructure = '<div class="form-group"><label for="location-select-<%CONFIGID%>" class="control-label">{{\"<%CONFIGLABEL%>\" | translate}}</label><div class="pull-right"><span class="glyphicon glyphicon-globe" ng-class="{\'error\' : !locationSelect.locationStore.<%CONFIGID%>.model.data.length}"></span> {{locationSelect.locationStore.<%CONFIGID%>.model.data.length}}</div><select ng-disabled="locationSelect.session.locationSearch" ng-model="locationSelect.locationStore.<%CONFIGID%>.value" ng-options="<%CONFIGID%>.uuid as <%CONFIGID%>.<%CONFIGCOLUMN%> for <%CONFIGID%> in locationSelect.locationStore.<%CONFIGID%>.model.data | orderBy : \'name\'" ng-change=<%CONFIGCHANGE%> class="form-bhima" id="location-select-<%CONFIGID%>"><option value="" ng-if="!locationSelect.locationStore.<%CONFIGID%>.model.data.length" disblaed="disabled">----</option></select></div>'; 
        // var initialTemplate =
        var templateString = '';
        var configurationList = Object.keys(config).reverse();
        configurationList.forEach(function (key) { 
          var configObject = config[key];
          var component = componentStructure;

          var changeSubmit;

          changeSubmit = lookupDependency(key) ? 
            '\"locationSelect.fetchLocationData(\'' + lookupDependency(key) + '\', locationSelect.locationStore.' + configObject.id + '.value)\"' : 
            '\"locationSelect.submitVillage(locationSelect.locationStore.' + configObject.id + '.value)\"';  

          component = component.replace(/<%CONFIGID%>/g, configObject.id);
          component = component.replace(/<%CONFIGLABEL%>/g, configObject.label);
          component = component.replace(/<%CONFIGCOLUMN%>/g, configObject.column);
          component = component.replace(/<%CONFIGDEPEND%>/g, lookupDependency(key));

          component = component.replace(
            /<%CONFIGCHANGE%>/g, 
            changeSubmit 
          ); 
          compile = compile.concat(component);
        });

        return compile; 
      }

      namespace.lookupModel = lookupModel;
      namespace.fetchLocationData = fetchLocationData;
      namespace.submitVillage = submitVillage;
    }
  };
}]);
