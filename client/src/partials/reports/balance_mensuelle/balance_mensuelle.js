angular.module('bhima.controllers')
.controller('ReportBalanceMensuelleController', ReportBalanceMensuelleController);

ReportBalanceMensuelleController.$inject = [
  '$translate', '$window', 'validate', 'util', 'messenger', 'exportFile', 'SessionService'
];

/**
  * Report Balance Mensuelle Controller
  * This controller is responsible for managing balance menselle data
  */
function ReportBalanceMensuelleController ($translate, $window, validate, util, messenger, exportFile, SessionService) {
  var vm = this,
      dependencies = {}, session = vm.session = {},
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
  vm.download = download;
  vm.reconfigure = reconfigure;
  vm.getAccountBalance = getAccountBalance;
  vm.formatAccount = formatAccount;
  vm.print = printer;

  // Startup
  startup();

  // Functions
  function startup() {
    session.project = SessionService.project.id;
  }

  function initialize(model) {
    angular.extend(vm, model);
    var balance = model.balance_mensuelle.data,
     newSoldeDebit, newSoldeCredit;

    balance.forEach(function (balances) {
      newSoldeDebit = balances.old_debit + balances.debit;
      newSoldeCredit = balances.old_credit + balances.credit;

      if(balances.is_asset === 1){
        if (balances.old_debit > balances.old_credit){
          balances.old_debit -= balances.old_credit;
          balances.old_credit = 0;
        } else {
          balances.old_credit -= balances.old_debit;
          balances.old_debit = 0;
        }

        if (newSoldeDebit > newSoldeCredit){
          balances.solde_debit = newSoldeDebit - newSoldeCredit;
          balances.solde_credit = 0;
        } else {
          balances.solde_credit = newSoldeCredit - newSoldeDebit;
          balances.solde_debit = 0;
        }

      } else if (balances.is_asset === 0){
        if (balances.old_debit > balances.old_credit){
          balances.old_debit -= balances.old_credit;
          balances.old_credit = 0;
        } else {
          balances.old_credit -= balances.old_debit;
          balances.old_debit = 0;
        }

        if (newSoldeDebit < newSoldeCredit){
          balances.solde_debit = 0;
          balances.solde_credit = newSoldeCredit - newSoldeDebit;
        } else {
          balances.solde_debit = newSoldeDebit - newSoldeCredit;
          balances.solde_credit = 0;
        }
      }
    });
  }

  function getAccountBalance() {
    vm.state = 'generate';
    if(session.classe && session.periode){

      var params = {
        project : session.project,
        classe  : session.classe.number,
        periode : util.sqlDate(session.periode)
      },
        rootReport = 'balance_mensuelle';

      if(session.classe.number === '*'){
        rootReport = 'balance_mensuelle_all';
      }

      dependencies.balance_mensuelle = { query : 'reports/' + rootReport + '/?' + JSON.stringify(params) };
      validate.process(dependencies, ['balance_mensuelle'])
      .then(initialize)
      .then(calculTotaux);
    }else {
      messenger.info($translate.instant('BALANCE_MENSUELLE.INFO_FILL_INPUT'), true);
    }
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
    var metadata = util.htmlDate(session.periode) + '_' + session.classe.number + '(' + session.classe.name + ')';
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
