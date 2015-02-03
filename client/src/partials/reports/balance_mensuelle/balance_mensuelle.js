angular.module('bhima.controllers')
.controller('report.balance_mensuelle', [
  '$scope',
  '$translate',
  '$window',
  'validate',
  'appstate',
  'util',
  'messenger',
  function ($scope, $translate, $window, validate, appstate, util, messenger) {
    var dependencies = {}, session = $scope.session = {},
      state = $scope.state;

    session.classes = [
      { number : 1, name : $translate.instant('ACCOUNT.ACCOUNT_EQUITY')},
      { number : 2, name : $translate.instant('ACCOUNT.ACCOUNT_ASSET')},
      { number : 3, name : $translate.instant('ACCOUNT.ACCOUNT_STOCKS')},
      { number : 4, name : $translate.instant('ACCOUNT.ACCOUNT_THPART')},
      { number : 5, name : $translate.instant('ACCOUNT.ACCOUNT_FINC')},
      { number : 6, name : $translate.instant('ACCOUNT.ACCOUNT_COST')},
      { number : 7, name : $translate.instant('ACCOUNT.ACCOUNT_REV')}
    ];

    appstate.register('project', function (project) {
      session.project = project.id;
    });

    function startup(model) {
      angular.extend($scope, model);
    }

    function getAccountBalance() {
      $scope.state = 'generate';
      if(session.classe && session.periode){
        var params = {
          project : session.project,
          classe  : session.classe.number,
          periode : util.sqlDate(session.periode)
        };

        dependencies.balance_mensuelle = { query : 'reports/balance_mensuelle/?' + JSON.stringify(params) };
        validate.process(dependencies, ['balance_mensuelle'])
        .then(startup)
        .then(calculTotaux);
      }else {
        messenger.info($translate.instant('BALANCE_MENSUELLE.INFO_FILL_INPUT'), true);
      }
    }

    function formatAccount(classe) {
      return '[' + classe.number + ']' + classe.name;
    }

    function print() { $window.print(); }

    function calculTotaux() {
      session.sumOldDebit = $scope.balance_mensuelle.data.reduce(function sum(a, b) { return a + b.old_debit; },0);
      session.sumOldCredit = $scope.balance_mensuelle.data.reduce(function sum(a, b) { return a + b.old_credit; },0);
      session.sumDebit = $scope.balance_mensuelle.data.reduce(function sum(a, b) { return a + b.debit; },0);
      session.sumCredit = $scope.balance_mensuelle.data.reduce(function sum(a, b) { return a + b.credit; },0);
    }
    
   function reconfigure () {
      $scope.state = null;
      $scope.session.classe = null;
      $scope.session.periode = null;
    }    

    // Exports
    $scope.reconfigure = reconfigure;
    $scope.getAccountBalance = getAccountBalance;
    $scope.formatAccount = formatAccount;
    $scope.print = print;
  }
]);