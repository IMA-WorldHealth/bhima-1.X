angular.module('bhima.controllers')
.controller('configureBilan', [
  '$scope',
  '$http',
  '$routeParams',
  '$translate',
  '$sce',
  'validate',
  // Prototype document building module, requests document given configuration obejct
  function ($scope, $http, $routeParams, $translate, $sce, validate) {

    // Configuration objects optionally passed to /report/build - drives configuration UI
    var session = $scope.session = {},
        dependencies = {},
        generatedDocumentPath = null,
        serverUtilityPath = '/report/build/bilan';

    var configuration = {
      language : {
        options : [
          {value : 'en', label : 'English'},
          {value : 'fr', label : 'French'}
        ]
      }
    };

    dependencies.fiscalYears = {
      query : {
        identifier : 'id',
        tables : {
          'fiscal_year' : {
            columns : ['id', 'fiscal_year_txt']
          }
        }
      }
    };

    $scope.generate_doc = $translate.instant('BILAN.GENERATE_DOC');
    $scope.loading = $translate.instant('BILAN.LOADING');

    //getting fiscal years

    validate.process(dependencies)
    .then(setDefaultConfiguration);

    // Expose configuration to scope - set module state
    session.building = false;
    $scope.configuration = configuration;

    function selectConfiguration(key, value) {
      configuration[key].selected = value;
    }

    function setDefaultConfiguration(models) {
      angular.extend($scope, models);
      selectConfiguration('language', configuration.language.options[1]);
      $scope.session.fiscal_year_id = $scope.fiscalYears.data[$scope.fiscalYears.data.length-1].id
    }

    // POST configuration object to /report/build/:target
    function generateDocument() {
      var path = serverUtilityPath;
      var configurationObject = {};

      // Temporarily set configuration options - This shouldn't be manually compiled
      configurationObject.language = configuration.language.selected.value;
      configurationObject.fy = $scope.session.fiscal_year_id;

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
