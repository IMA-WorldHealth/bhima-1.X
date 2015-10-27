angular.module('bhima.controllers')
.controller('OperatingAccountController', OperatingAccountController);

OperatingAccountController.$inject = [
  '$translate', 'validate', 'SessionService', 'connect', 'exportFile', 'util'
];

/**
  * Operating Account controller
  * This controller is responsible to generate a report of operations
  */
function OperatingAccountController ($translate, validate, SessionService, connect, exportFile, util) {
  var vm = this,
      dependencies = {},
      session = vm.session = {},
      state = vm.state;

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

  dependencies.periods = {
    query : {
      identifier : 'id',
      tables : {
        'period' : {
          columns : ['id', 'fiscal_year_id', 'period_start', 'period_stop']
        }
      }
    }
  };

  // Expose to view
  vm.all = 'all';
  vm.getPeriods = getPeriods;
  vm.generate = generate;
  vm.reconfigure = reconfigure;
  vm.printReport = printReport;
  vm.download = download;
  vm.formatPeriod = formatPeriod;

  // Startup
  startup();

  // Functions
  function startup() {
    vm.enterprise = SessionService.enterprise;
    validate.process(dependencies)
    .then(initialize);
  }

  function initialize (models) {
    angular.extend(vm, models);
  }

  function getPeriods () {
    var selectablePeriods = vm.periods.data.filter(function (p) {
      return p.fiscal_year_id === session.fiscal_year_id && p.period_start !== '0000-00-00';
    });
    vm.selectablePeriods = selectablePeriods;
  }

  function formatPeriod(per) {
    return '' + util.htmlDate(per.period_start) + ' -- ' + util.htmlDate(per.period_stop);
  }

  function generate () {
    if(session.period_id === 'all'){
      vm.all_period = $translate.instant('OPERATING_ACCOUNT.ALL');
    }

    connect.fetch('/reports/operatingAccount/?period_id=' + session.period_id + '&fiscal_id=' + session.fiscal_year_id)
    .then(function (data) {
      vm.debitTotal = 0;
      vm.creditTotal = 0;
      vm.Result = 0;

      for(var item in data){
        vm.debitTotal += data[item].debit;
        vm.creditTotal += data[item].credit;
        vm.Result = vm.creditTotal - vm.debitTotal;
      }

      vm.records = data;
      vm.state = 'generate';

    });
  }

  function download() {
    var fileData = {};
    var periodInfo = session.period_id === 'all' ? vm.all_period : (util.htmlDate(vm.periods.get(session.period_id).period_start)) + '_' + (util.htmlDate(vm.periods.get(session.period_id).period_stop));
    var fileName = $translate.instant('OPERATING_ACCOUNT.TITLE') +
                  '_' + vm.fiscalYears.get(session.fiscal_year_id).fiscal_year_txt +
                  '_' + periodInfo;

    fileData.column = [
      $translate.instant('COLUMNS.ACCOUNT'),
      $translate.instant('COLUMNS.LABEL'),
      $translate.instant('COLUMNS.CHARGE'),
      $translate.instant('COLUMNS.PROFIT')
    ];
    fileData.data = vm.records.map(function (item) {
      return {
        'account_number' : item.account_number,
        'account_txt'    : item.account_txt,
        'credit'         : item.debit,
        'debit'          : item.credit
      };
    });
    exportFile.csv(fileData, fileName, false);
  }

  function reconfigure () {
    vm.state = null;
    session.fiscal_year_id = null;
    session.period_id = null;
  }

  function printReport () {
    print();
  }

}
