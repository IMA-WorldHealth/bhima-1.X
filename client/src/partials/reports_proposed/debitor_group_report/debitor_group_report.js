var configureDebitorGroupReport = function ($http, $translate, validate, reportConfigService, messenger) {

  var vm = this,
  generatedDocumentPath = null,
  serverUtilityPath = '/report/build/debitor_group',
  configuration = reportConfigService.configuration;

  vm.generate_doc = $translate.instant('DEBITOR_GROUP_REPORT.GENERATE_DOC');
  vm.loading = $translate.instant('DEBITOR_GROUP_REPORT.LOADING');

  setDefaultConfiguration();

  // Expose configuration to scope - set module state
  vm.building = false;
  vm.configuration = configuration;

  function selectConfiguration(key, value) {
    configuration[key].selected = value;
  }

  function setDefaultConfiguration() {
    selectConfiguration('language', configuration.language.options[1]);
  }

  // POST configuration object to /report/build/:target
  function generateDocument() {
    var path = serverUtilityPath;
    var configurationObject = {};

    // Temporarily set configuration options - This shouldn't be manually compiled
    configurationObject.language = configuration.language.selected.value;
    configurationObject.enterprise = configuration.enterprise;
    configurationObject.project = configuration.project;

    // Update state
    vm.building = true;

    $http.post(path, configurationObject)
    .success(function (result) {
      // Expose generated document path to template
      vm.building = false;
      vm.generatedDocumentPath = result;
    })
    .error(function (code) {
      vm.building = false;
      messenger.danger('error' + code);
    });
  }

  function clearPath() {
    vm.generatedDocumentPath = null;
  }

  vm.selectConfiguration = selectConfiguration;
  vm.generateDocument = generateDocument;
  vm.clearPath = clearPath;
};

configureDebitorGroupReport.$inject =['$http', '$translate', 'validate', 'reportConfigService', 'messenger'];
angular.module('bhima.controllers').controller('configureDebitorGroupReport', configureDebitorGroupReport);
