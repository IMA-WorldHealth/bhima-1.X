angular.module('bhima.controllers')
.controller('configureBilan', [
  '$scope',
  '$http',
  '$routeParams',
  '$sce',

  // Prototype document building module, requests document given configuration obejct
  function ($scope, $http, $routeParams, $sce) {

    // Configuration objects optionally passed to /report/build - drives configuration UI
    var configuration = {
      language : {
        options : [
          {value : 'en', label : 'English'},
          {value : 'fr', label : 'French'}
        ]
      }
    };

    var serverUtilityPath = '/report/build/bilan';
    var generatedDocumentPath = null;
    var session = $scope.session = {};

    // Expose configuration to scope - set module state
    session.building = false;
    $scope.configuration = configuration;

    // TODO Load default configuration from appcache if it exists before selecting default
    setDefaultConfiguration();

    function selectConfiguration(key, value) {
      configuration[key].selected = value;
    }

    function setDefaultConfiguration() {
      selectConfiguration('language', configuration.language.options[0]);
    }

    // POST configuration object to /report/build/:target
    function generateDocument() {
      var path = serverUtilityPath;
      var configurationObject = {};

      // Temporarily set configuration options - This shouldn't be manually compiled
      configurationObject.language = configuration.language.selected.value;

      // Update state
      session.building = true;

      $http.post(path, configurationObject)
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
    function downloadDocument(url) {

      $http.get(url, {responseType : 'arraybuffer'})
      .success(function (pdfResult) {
        var file = new Blob([pdfResult], {type: 'application/pdf'});
        var fileURL = URL.createObjectURL(file);

        // Expose document to scope
        $scope.pdfContent = $sce.trustAsResourceUrl(fileURL);
      });
    }

    function clearPath() {
      $scope.generatedDocumentPath = null;
    }

    $scope.selectConfiguration = selectConfiguration;
    $scope.generateDocument = generateDocument;
    $scope.clearPath = clearPath;
  }
]);
