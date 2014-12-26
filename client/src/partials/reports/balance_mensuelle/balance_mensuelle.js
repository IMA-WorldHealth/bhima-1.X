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
    var dependencies = {}, session = $scope.session = {};

    session.classes = [
      { number : 1, name : 'Fonds propres'},
      { number : 2, name : 'Valeurs immob. & Eng.'},
      { number : 3, name : 'Valeurs d\'exploitation'},
      { number : 4, name : 'Fournisseurs, Tiers & Regular.'},
      { number : 5, name : 'Comptes Financiers'},
      { number : 6, name : 'Charges et Pertes'},
      { number : 7, name : 'Produits et Profits'}
    ];

    appstate.register('project', function (project) {
      session.project = project.id;
    });

    function startup(model) {
      angular.extend($scope, model);
    }

    function getAccountBalance() {
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
      session.sum_old_debit = $scope.balance_mensuelle.data.reduce(function sum(a, b) { return a + b.old_debit; },0);
      session.sum_old_credit = $scope.balance_mensuelle.data.reduce(function sum(a, b) { return a + b.old_credit; },0);
      session.sum_debit = $scope.balance_mensuelle.data.reduce(function sum(a, b) { return a + b.debit; },0);
      session.sum_credit = $scope.balance_mensuelle.data.reduce(function sum(a, b) { return a + b.credit; },0);
    }
    

    // Exports
    $scope.getAccountBalance = getAccountBalance;
    $scope.formatAccount = formatAccount;
    $scope.print = print;
  }
]);