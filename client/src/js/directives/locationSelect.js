angular.module('bhima.directives')
.directive('locationSelect', ['validate', 'connect', function (validate, connect) { 
  return {
    restrict : 'A',
    replace : true,
    transclue : true,
    template : '<div><div class="form-group" ng-repeat="config in locationConfig">{{config.label}}</div></div>',
    link : function (scope) {
      
      // TODO rename variables etc. with useful names 
      var locationIndex = {};
      var locationConfig = scope.locationConfig = {
        village : {
          dependency : 'sector',
          label : 'LOCATION.VILLAGE',
          column : 'name'
        },
        sector : {
          label : 'LOCATION.SECTOR',
          column : 'name'
        },
        province : {
          dependency : 'country',
          label : 'LOCATION.PROVINCE',
          column : 'name'
        },
        country : {
          dependency : null,
          label : 'LOCATION.COUNTRY',
          column : 'country_en'
        }
      };
      var locationStore = scope.locationStore = {};
      
      // TODO refactor
      settup();

      function settup() {
        indexLocationDependencies();

        console.log('index', locationIndex);

        console.log('sector dependency :', locationConfig.sector.dependency);
        console.log('requires sector : ', lookupDependency('sector'));
      }

      function indexLocationDependencies() {
        Object.keys(locationConfig).forEach(function (key) {
          locationIndex[locationConfig[key].dependency] = key;
        });
      }
      
      function defineLocationRequests() {
        Object.keys(locationConfig).forEach(function (key) {
          var config = locationConfig[key];
          var requires = lookupDependency(key);
          var request = {
            query : {
              identifier : 'uuid',
              tables : {},
              order : [config.label]
            }
          };
          request.query.tables[key] = {
            columns : ['uuid', config.label]
          };
          
          if (requires) {
            request.query.tables[key].columns.push(formatKeyId(requires));
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
