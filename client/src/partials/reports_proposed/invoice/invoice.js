angular.module('bhima.controllers')
.controller('configureInvoice', [
  '$scope', 
  '$http',

  // Prototype document building module, requests document given configuration obejct
  function ($scope, $http) { 
    
    // Configuration objects optionally passed to /report/build - drives configuration UI
    var configuration = { 
      format : {
        options : [ 
          {value : 'compact', label : 'Compact'},
          {value : 'standard', label : 'Standard'}
        ]
      },
      language : { 
        options : [
          {value : 'en', label : 'English'},
          {value : 'fr', label : 'French'}
        ]
      },
      currency : {
        options : [
          {value : 'dollars', label : 'Dollars'},
          {value : 'francs', label : 'Francs'}
        ]
      }
    };
  
    var serverUtilityPath = '/report/build/';
    var generatedDocumentPath = null;
    var session = $scope.session = {};
   
    // Expose configuration to scope - set module state
    session.building = false;
    $scope.configuration = configuration;

    // TODO Load default configuration from appcache if it exists before selecting default
    setDefaultConfiguration();
        
    function selectConfiguration (key, value) { 
      configuration[key].selected = value;
    }

    function setDefaultConfiguration () { 
      selectConfiguration('format', configuration.format.options[0]);
      selectConfiguration('language', configuration.language.options[0]);
      selectConfiguration('currency', configuration.currency.options[0]);
    }
  
    // POST configuration object to /report/build/:target
    function generateDocument () { 
      var path = serverUtilityPath;
    
      // Temporarily set configuration options - this will eventually be passed through post
      path = path.concat(configuration.language.selected.value, '/');
      path = path.concat(configuration.format.selected.value);
 
      // Update state
      session.building = true;

      $http.get(path)
      .success(function (result) { 
        
        // Expose generated document path to template
        session.building = false;
        $scope.generatedDocumentPath = result;
      })
      .error(function (code) { 
        session.building = false; 
        
        // TODO Handle error
      });
    }

    // Utility method - GET PDF blob displaying embedded object
    function downloadDocument () { 
      
      $http.get(result, {responseType : 'arraybuffer'})
      .success(function (pdfResult) { 
        var file = new Blob([pdfResult], {type: 'application/pdf'});
        var fileURL = URL.createObjectURL(file);
      
        // Expose document to scope
        $scope.pdfContent = $sce.trustAsResourceUrl(fileURL);
      });
    }

    function clearPath () { 
      $scope.generatedDocumentPath = null;
    }

    $scope.selectConfiguration = selectConfiguration;
    $scope.generateDocument = generateDocument;
    $scope.clearPath = clearPath;
  }
]);
