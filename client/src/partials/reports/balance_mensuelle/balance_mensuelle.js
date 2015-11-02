angular.module('bhima.controllers')
.controller('ReportBalanceMensuelleController', ReportBalanceMensuelleController);

ReportBalanceMensuelleController.$inject = [
  '$translate', '$window', '$http', 'messenger', 'exportFile', 'SessionService',
  'DateService'
];

/**
* Report Balance Mensuelle Controller
* This controller is responsible for managing balance menselle data
*/
function ReportBalanceMensuelleController($translate, $window, $http, messenger, exportFile, Session, Dates) {
  var vm = this,
      dependencies = {},
      session = vm.session = {},
      state = vm.state;

  session.classes = [
    { number : 1, name : $translate.instant('ACCOUNT.ACCOUNT_EQUITY')},
    { number : 2, name : $translate.instant('ACCOUNT.ACCOUNT_ASSET')},
    { number : 3, name : $translate.instant('ACCOUNT.ACCOUNT_STOCKS')},
    { number : 4, name : $translate.instant('ACCOUNT.ACCOUNT_THPART')},
    { number : 5, name : $translate.instant('ACCOUNT.ACCOUNT_FINC')},
    { number : 6, name : $translate.instant('ACCOUNT.ACCOUNT_COST')},
    { number : 7, name : $translate.instant('ACCOUNT.ACCOUNT_REV')},
    { number : 8, name : $translate.instant('ACCOUNT.ACCOUNT_EXP_PROD')},
    { number : '*', name : $translate.instant('ACCOUNT.ALL_ACCOUNT')}
  ];


  // Expose to the view
  vm.loading = false;
  vm.download = download;
  vm.reconfigure = reconfigure;
  vm.submit = submit;
  vm.formatAccount = formatAccount;
  vm.print = printer;

  // Startup
  startup();

  // Functions
  function startup() {
    session.project = Session.project.id;
    session.enterprise = Session.enterprise;
  }

  function initialize(model) {
    angular.extend(vm, model);
    var balance = model.balance_mensuelle.data,
        newSoldeDebit, newSoldeCredit;

    balance.forEach(function (balances) {
      newSoldeDebit = balances.old_debit + balances.debit;
      newSoldeCredit = balances.old_credit + balances.credit;

      if (balances.is_asset === 1) {
        if (balances.old_debit > balances.old_credit) {
          balances.old_debit -= balances.old_credit;
          balances.old_credit = 0;
        } else {
          balances.old_credit -= balances.old_debit;
          balances.old_debit = 0;
        }

        if (newSoldeDebit > newSoldeCredit) {
          balances.solde_debit = newSoldeDebit - newSoldeCredit;
          balances.solde_credit = 0;
        } else {
          balances.solde_credit = newSoldeCredit - newSoldeDebit;
          balances.solde_debit = 0;
        }

      } else if (balances.is_asset === 0) {
        if (balances.old_debit > balances.old_credit) {
          balances.old_debit -= balances.old_credit;
          balances.old_credit = 0;
        } else {
          balances.old_credit -= balances.old_debit;
          balances.old_debit = 0;
        }

        if (newSoldeDebit < newSoldeCredit) {
          balances.solde_debit = 0;
          balances.solde_credit = newSoldeCredit - newSoldeDebit;
        } else {
          balances.solde_debit = newSoldeDebit - newSoldeCredit;
          balances.solde_credit = 0;
        }
      }
    });
  }

  // actually submits the form
  function submit(invalid) {
    var url;

    if (invalid) { return; }

    vm.state = 'generate';
    vm.loading = true;

    // empty data caches
    vm.accounts = {};
    vm.totals = {};

    url = '/reports/balance_mensuelle?' +
        'enterpriseId=' + Session.enterprise.id +
        '&classe=' + session.classe.number +
        '&date=' + Dates.util.str(session.periode);

    // get the data
    $http.get(url)
    .then(function (response) {
      var accounts,
          totals,
          data = response.data;

      // make the accounts object
      accounts = data.beginning.reduce(function (accounts, row) {
        var account,
            id = row.account_number;

        if (!accounts[id]) { accounts[id] = {}; }
        account = accounts[id];
        account.beginDebit = row.debit;
        account.beginCredit = row.credit;
        account.account_txt = row.account_txt;
        return accounts;
      }, {});

      // add the middle references
      data.middle.forEach(function (row) {
        var account,
            id = row.account_number;

        if (!accounts[id]) { accounts[id] = {}; }
        account = accounts[id];
        account.middleDebit = row.debit;
        account.middleCredit = row.credit;
        account.account_txt = row.account_txt;
      });

      // add the final balances
      data.end.forEach(function (row) {
        var account,
            id = row.account_number;

        if (!accounts[id]) { accounts[id] = {}; }
        account = accounts[id];
        account.endDebit = row.debit;
        account.endCredit = row.credit;
        account.account_txt = row.account_txt;
      });

      // calculate totals
      totals = Object.keys(accounts).reduce(function (totals, key) {
        var account = accounts[key];
        totals.beginDebit += (account.beginDebit || 0);
        totals.beginCredit += (account.beginCredit || 0);
        totals.middleDebit += (account.middleDebit || 0);
        totals.middleCredit += (account.middleCredit || 0);
        totals.endDebit += (account.endDebit || 0);
        totals.endCredit += (account.endCredit || 0);
        return totals;
      }, {
        beginDebit : 0,
        beginCredit : 0,
        middleDebit: 0,
        middleCredit : 0,
        endDebit : 0,
        endCredit : 0
      });

      // expose to view
      vm.accounts = accounts;
      vm.totals = totals;
      vm.empty = Object.keys(accounts).length === 0;
    })
    .catch(function (error) {
      throw error;
    })
    .finally(function () {
      vm.loading = false;
    });
  }

  function formatAccount(classe) {
    return '[' + classe.number + ']' + classe.name;
  }

  function printer() { $window.print(); }

  function calculTotaux() {
    var sums = {
      sumOldDebit : 0,
      sumOldCredit : 0,
      sumDebit : 0,
      sumCredit : 0,
      solde_debit : 0,
      solde_credit :0
    };

    sums = vm.balance_mensuelle.data.reduce(function (summer, row) {
      summer.sumOldDebit += row.old_debit;
      summer.sumOldCredit += row.old_credit;
      summer.sumDebit += row.debit;
      summer.sumCredit += row.credit;
      summer.solde_debit += row.solde_debit;
      summer.solde_credit += row.solde_credit;
      return summer;
    }, sums);

    session.sumOldDebit = sums.sumOldDebit;
    session.sumOldCredit = sums.sumOldCredit;
    session.sumDebit = sums.sumDebit;
    session.sumCredit = sums.sumCredit;
    session.solde_debit = sums.solde_debit;
    session.solde_credit = sums.solde_credit;
  }

  function reconfigure () {
    vm.state = null;
    vm.session.classe = null;
    vm.session.periode = null;
  }

  function download() {
    var fileData = {};
    var metadata = Dates.util.str(session.periode) + '_' + session.classe.number + '(' + session.classe.name + ')';
    var fileName = $translate.instant('BALANCE_MENSUELLE.TITLE') +
                  '_' + metadata;

    fileData.column = [
      $translate.instant('BALANCE_MENSUELLE.ACCOUNT'),
      $translate.instant('BALANCE_MENSUELLE.LABEL'),
      $translate.instant('BALANCE_MENSUELLE.OLD_SOLD') + ' ' + $translate.instant('BALANCE_MENSUELLE.DEBITOR'),
      $translate.instant('BALANCE_MENSUELLE.OLD_SOLD') + ' ' + $translate.instant('BALANCE_MENSUELLE.CREDITOR'),
      $translate.instant('BALANCE_MENSUELLE.MONTH_MOVEMENT') + ' ' + $translate.instant('BALANCE_MENSUELLE.DEBIT'),
      $translate.instant('BALANCE_MENSUELLE.MONTH_MOVEMENT') + ' ' + $translate.instant('BALANCE_MENSUELLE.CREDIT'),
      $translate.instant('BALANCE_MENSUELLE.NEW_SOLD') + ' ' + $translate.instant('BALANCE_MENSUELLE.DEBITOR'),
      $translate.instant('BALANCE_MENSUELLE.NEW_SOLD') + ' ' + $translate.instant('BALANCE_MENSUELLE.CREDITOR')
    ];

    fileData.data = vm.balance_mensuelle.data.map(function (item) {
      return {
        'account_number' : item.account_number,
        'account_txt'    : item.account_txt,
        'old_debit'      : item.old_debit,
        'old_credit'     : item.old_credit,
        'debit'          : item.debit,
        'credit'         : item.credit,
        'solde_debit'    : item.solde_debit,
        'solde_credit'   : item.solde_credit
      };
    });

    exportFile.csv(fileData, fileName, false);
  }

}
