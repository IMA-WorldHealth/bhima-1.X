angular.module('bhima.controllers')
.controller('configureInvoice', [
  '$scope', 
  '$q',
  '$http',
  '$sce',
  'appcache',
  function ($scope, $q, $http, $sce, appcache) { 
      
    var configuration = { 
      format : {
        
        options : [ 
          { 
            value : 'compact', 
            label : 'Compact'
          },
          { 
            value : 'standard', 
            label : 'Standard'
          }
        ]

      },
      
      language : { 

        options : [
          { 
            value : 'en', 
            label : 'English'
          },
          {
            value : 'fr',
            label : 'French'
          }
        ]
      
      },
    
      // Could be populated from the currency table
      currency : {

        options : [
          { 
            value : 'dollars', 
            label : 'Dollars', 
          },
          { 
            value : 'francs',
            label : 'Francs'
          }
        ]

      }
    };
  
    var generatedPath = $scope.generatedPath = null;
  
    var session = $scope.session = {};
    session.building = false;

    $scope.configuration = configuration;

    configuration.format.selected = configuration.format.options[0];
    configuration.language.selected = configuration.language.options[0];
    configuration.currency.selected = configuration.currency.options[0];
    
    console.log('invoice controller initialised');
    
    $scope.selectConfiguration = function (key, value) { 
      configuration[key].selected = value;
    };

    $scope.generateDocument = function () { 

      var path = '/report/build/';

      path = path.concat(configuration.language.selected.value, '/');
      path = path.concat(configuration.format.selected.value);
  
      session.building = true;

      $http.get(path)
      .success(function (result) { 
        console.log('get request returned', result);
        
        session.building = false;
        $scope.generatedPath = result;
  
        // Temporary 
        $http.get(result)
        .success(function (pdfResult) { 
      
          var file = new Blob([pdfResult], {type: 'application/pdf'});
          var fileURL = URL.createObjectURL(file);

          $scope.pdfContent = $sce.trustAsResourceUrl(fileURL);
          console.log($scope.pdfContent)
        });
      })
      .error(function (code) { 
        session.building = false; 
        
        // Handle error
      });

    };

    $scope.clearDocument = function () { 
      $scope.generatedPath = null;
    };

    // Verify that requested sale exists 
    
    // Allow configuration 
    
    // Send request for compilation
  }
]);

