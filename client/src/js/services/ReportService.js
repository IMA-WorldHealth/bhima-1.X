'use strict';

/**
 * @description 
 * Act as an interface between the core reporting module and the BHIMA server. 
 * Primarily responsible for fetching and caching supported report lists as well 
 * as retrieving previously generated report archives
 *
 * @todo This service uses a custom method for relying on information that may 
 * not yet be available - a best practice for doing this should be applied across
 * all BHIMA modules. 
 */

angular.module('bhima.services')
.factory('ReportService', ReportService);

ReportService.$inject = ['$http', '$q', 'store'];

function ReportService($http, $q, Store) { 
  var reportIndexCache = new Store({identifier : 'key'});
  var serviceDependency = $q.defer();
  
  var generateTemplatesPath = 'partials/development/reports/generate/';
  var generateTemplateConvention = '.generate.tmpl.html';
  var generateControllerConvention = 'Controller';
  var generateAliasConvention = ' as ?Ctrl';
  
  // Tasks run on service startup
  cacheIndex();

  function cacheIndex() { 
  
    $http.get('report/index')
      .then(function (reportIndex) { 
        reportIndexCache.setData(reportIndex.data);
        
        // Notify any $routeProvider resolve methods waiting on this dependency 
        serviceDependency.resolve();
        
        // Update legacy deferred request state
        loadedReportIndex = true;
        fulfillPromises();
      });
      // .catch()
  }

  function fetchArchive(id) { 
    var archivePath = 'report/archives/'.concat(id);

    return $http.get(archivePath);
  }

  function resolveTemplatePath(reportKey) { 
    return generateTemplatesPath.concat(reportKey).concat(generateTemplateConvention);
  }

  function resolveController(reportKey) { 
    var controller = reportKey.concat(generateControllerConvention);
    var alias = controller.concat(generateAliasConvention).replace('?', reportKey);

    return alias;
  }
  
  /**
   * @description 
   * Return database report definition by key, this method assumes that the 
   * controller requesting the definition has properly configured the 
   * serviceDependency resolve in $routeProvider
   */
  function requestDefinition(key) { 
    console.log('key', key,  reportIndexCache);
    return reportIndexCache.get(key);
  }

  /**
   * Legacy deferred request solution. 
   * This can be avoided by requiring the service dependency to have loaded 
   * using $routeProvider resolve
   * (Variables initialised here as they are seperate from the core service
   * code)
   */
  var loadedReportIndex = false;
  var unfufilled = [];

  function requestDefinitionDeferred(key) { 
    var deferred = $q.defer();
    
    // Log promise to be resolved once the index is fetched
    if (!loadedReportIndex) { 
      unfufilled.push({key : key, deferred : deferred});
      
    } else { 
      lookupDefinition(key, deferred);
    }

    return deferred.promise;
  }

  function lookupDefinition(key, deferred) { 
    var definition = reportIndexCache.get(key);
    
    if (angular.isDefined(definition)) { 
      deferred.resolve(definition);
    } else { 
      deferred.reject();
    }
  }
  
  function fulfillPromises() { 
    unfufilled.forEach(function (request) { 
      lookupDefinition(request.key, request.deferred);       
    });
  
    // Deference objects that will no longer be needed
    unfufilled = null;
  }

  return { 
    dependency : serviceDependency.promise, 
    requestDefinition : requestDefinition,
    requestDefinitionDeferred : requestDefinitionDeferred,
    fetchArchive : fetchArchive,
    resolveTemplatePath : resolveTemplatePath,
    resolveController : resolveController
  };
}
