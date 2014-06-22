angular.module('bhima.directives')
.directive('locationSelect', ['appstate', 'connect', function (appstate, connect) { 
  return {
    restrict : 'A',
    replace : true,
    transclue : true,
    template : '<div><div class="form-group" ng-repeat="config in locationSelect.locationConfig"><label for="location-select-{{config.id}}" class="control-label">{{config.label | translate}}</label><div class="pull-right"><span class="glyphicon glyphicon-globe"></span> 0</div><select ng-disabled="!locationSelect.session.locationSearch" class="form-bhima" id="location-select-{{config.id}}"></select></div></div>',
    link : function (scope) {
      
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
        },
        province : {
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
          locationStore[key] = {model : {}, value : null};
          locationStore[key].value = defaultLocation[formatKeyId(key)];
        });

        // Initial request, update config with no dependency
        updateLocation(lookupDependency(null), null);
      }

      function updateLocation(key, uuidDependency) {
        fetchLocationData(key, uuidDependency)
        .then(function (data) {
          return assignLocationData(key, data);
        });
      }

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
          config.request.query.where = [key + '.' + formatKeyId(config.dependency) + '=' + uuidDependency];
        }
        return connect.fetch(config.request);
      }

      function assignLocationData(key, result) {
        var currentLocationValue, invalidCurrentLocation, locationsFound;
        var store = locationStore[key];
        var requiresCurrentKey = lookupDependency(key);
  
        store.model = result;
        currentLocationValue = store.value;

        // Conditions 
        invalidCurrentLocation = angular.isNull(store.model.get(store.value));
        locationsFound = store.model.data.length;

        if (invalidCurrentLocation) {
          
          // Select default value if there are any 
          if (locationsFound) {
            currentLocationValue = store.value = store.model.data[0];
          }
        }
        
        // Call any configuration that requires on this key
        if (requiresCurrentKey) {
          updateLocation(requiresCurrentKey, currentLocationValue.uuid);
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
            query : {
              identifier : 'uuid',
              tables : {},
              order : [config.column]
            }
          };
          request.query.tables[key] = {
            columns : ['uuid', config.column]
          };
          
          if (config.dependency) {
            request.query.tables[key].columns.push(formatKeyId(config.dependency));
          }
          config.request = request;
        });
      }

      // Search will only ever have to hit 4 elements, convenience method
      function lookupDependency (currentKey) {
        
        // return locationConfig[locationIndex[currentKey]];
        return locationIndex[currentKey];
      }

      function formatKeyId(key) {
        var uuidSuffix = '_uuid';
        return key.concat(uuidSuffix);
      }
    }
  };
}]);
