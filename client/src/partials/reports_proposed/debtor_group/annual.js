angular.module('bhima.controllers')
.controller('DebtorGroupAnnualReportController', DebtorGroupAnnualReportController);

DebtorGroupAnnualReportController.$inject = [ '$http', '$sce' ];

/**
* Debtor Group Annual PDF Report
*
* This report provides an overview of all debits and credits accrued by each
* debtor group over the selected fiscal year.  This should only be done for
* fiscal years that are closed, and therefore have closing balances posted.
*
* DEV NOTE
*   This controller is largely based of the Balance Sheet PDF report, with a
* slight code refresh (controller as syntax, etc).  If there are critical bugs
* or updates to be made there, it is likely the case that they need to be
* changed here as well.
*/
function DebtorGroupAnnualReportController($http, $sce) {
  var vm = this;

  vm.state = 'fresh';

  // TODO -- is this defined in a central location somewhere?  Maybe a service?
  // Configuration objects optionally passed to /report/build - drives configuration UI
  vm.configuration = {
    language : {
      options : [
        {value : 'en', label : 'English'},
        {value : 'fr', label : 'French'}
      ]
    }
  };

  vm.setLanguage = setLanguage;
  vm.generateDocument = generateDocument;
  vm.clearPath = clearPath;

  /* ------------------------------------------------------------------------ */

  // generic error handler
  function handler(error) {
    console.log('An error occurred:', error);
  }

  // start the module up.
  function startup() {

    // get the fiscal years
    $http.get('/fiscal')
    .then(function (response) {
      vm.fiscalYears = response.data;
    })
    .catch(handler);

    // set a default language
    setLanguage(vm.configuration.language.options[0]);
  }

  // set the desired language configuration
  function setLanguage(lang) {
    vm.configuration.language.selected = lang;
  }

  // POST configuration object to /report/build/:target
  function generateDocument(invalid) {

    // TODO -- find a better path name
    var path = '/report/build/debtor_group_annual_report';
    var configurationObject = {};

    // if it did not pass Angular's form validation, do not submit to the server
    if (invalid) { return; }

    // Temporarily set configuration options - This shouldn't be manually compiled
    configurationObject.language = vm.configuration.language.selected.value;
    configurationObject.fy = vm.fiscalYearId;

    // Update state
    vm.state = 'loading';

    $http.post(path, configurationObject)
    .then(function (response) {
      vm.generatedDocumentPath = response.data;
    })
    .catch(handler)
    .finally(function () { vm.state = 'done'; });
  }

  // Utility method - GET PDF blob displaying embedded object
  function downloadDocument(url) {
    $http.get(url, { responseType : 'arraybuffer' })
    .then(function (response) {
      var file = new Blob([response.data], {type: 'application/pdf'});
      var fileURL = URL.createObjectURL(file);

      // Expose document to scope
      vm.pdfContent = $sce.trustAsResourceUrl(fileURL);
    });
  }

  function clearPath() {
    vm.generatedDocumentPath = null;
  }

  startup();
}
