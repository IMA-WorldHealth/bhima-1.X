angular.module('bhima.controllers')
.controller(
  'DepotStockDistributionsController', DepotStockDistributionsController
);

DepotStockDistributionsController.$inject = [
  '$routeParams', '$http', 'util', 'DateService', 'validate', 'reportConfigService', '$translate'
];

function DepotStockDistributionsController($routeParams, $http, util, Dates, validate, reportConfigService, $translate) {
  
  var vm = this, dependencies = {}, configuration = reportConfigService.configuration;

  dependencies.inventories = {
    query : {
      tables : {
        'inventory' : {
          columns : ['uuid', 'code', 'text']
        },
        'inventory_unit' : {
          columns : ['text::unit']
        }
      },
      join : ['inventory.type_id=inventory_unit.id'],
      where : ['inventory.consumable=1'],
      orderby: ['inventory.text','inventory.code']
    }
  };

  // expose models to view
  vm.session = {};
  vm.loading = false;
  vm.depotId = $routeParams.depotId;
  vm.type    = $routeParams.type;
  vm.url     = '/partials/depots/reports/distributions/templates/' + vm.type + '.html';
  vm.title   = 'DEPOT.DISTRIBUTION.' + vm.type.toUpperCase();
  vm.select  = select;
  vm.fetch   = search;

  vm.building = false;

  vm.generate_doc = $translate.instant('FILE.GENERATE_DOC');
  vm.loading = $translate.instant('FILE.LOADING');

  vm.generateDocument = generateDocument;


  // TODO - better naming scheme, possibly a service or directive
  vm.periods = [{
    key : 'CASH_PAYMENTS.DAY',
    method : today
  }, {
    key : 'CASH_PAYMENTS.WEEK',
    method : week
  }, {
    key : 'CASH_PAYMENTS.MONTH',
    method : month
  }];

  startup();

  /* ----------------------------------------------------------------------- */

  function select(period) {
    vm.selected = period;
    period.method();
  }

  function handleData (models){
    angular.extend(vm, models);
  }

  function search() {

    if (vm.type == 'file') {

      validate.process(dependencies)
        .then(handleData)
        .catch(function (err) {
          console.log(err);
        });
    }else {
      var url;

      vm.loading = true;

      url = [
        '/depots/' + vm.depotId,
        '/distributions?type=' + vm.type,
        '&start=' + util.sqlDate(vm.startDate),
        '&end=' + util.sqlDate(vm.endDate)
      ].join('');

      $http.get(url)
      .then(function (response) {
        vm.data = response.data;
      })
      .catch(function (err) {
        console.log(err);
      })
      .finally(function () {
        vm.loading = false;
      });
    }
    

  }

  function today() {
    vm.startDate = Dates.current.week();
    vm.endDate   = Dates.next.day();
    search();
  }

  function week() {
    vm.startDate = Dates.current.week();
    vm.endDate   = Dates.next.day();
    search();
  }

  function month() {
    vm.startDate = Dates.current.month();
    vm.endDate   = Dates.next.day();
    search();
  }

  function startup() {
    select(vm.periods[0]);
  }

  function generateDocument (){

    console.log(vm.session.inventory);

    var path = '/report/build/stock_file';
    var configurationObject = {};

    configurationObject.language = configuration.language.options[1].value;      
    configurationObject.enterprise = configuration.enterprise;
    configurationObject.project = configuration.project;
    configurationObject.inventory = vm.session.inventory;
    configurationObject.dateFrom = vm.startDate;
    configurationObject.dateTo = vm.endDate;
    configurationObject.depotId = vm.depotId;
      
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
        console.log('error' + code);
      });

  }
}
