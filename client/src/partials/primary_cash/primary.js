angular.module('bhima.controllers')
.controller('primaryCash', [
  '$scope',
  '$location',
  '$q',
  'validate',
  'appcache',
  function ($scope, $location, $q, validate, AppCache) {
    var dependencies = {}, configuration = $scope.configuration = {};
    var session = $scope.session = {
      configure : false,
      complete : false
    };
    var cache = new AppCache('primary_cash');

    dependencies.cashBox = {
      query : {
        tables : {
          cash_box : { columns : ['id', 'text', 'project_id', 'is_auxillary'] }
        },
        where : ['cash_box.is_auxillary=0']
      }
    };

    configuration.income = [
      {
        key : 'PRIMARY_CASH.INCOME.TRANSFER',
        link : '/primary_cash/transfert/'
      },
      {
        key : 'PRIMARY_CASH.INCOME.CONVENTION',
        link : '/primary_cash/convention/'
      },
      {
        key : 'PRIMARY_CASH.INCOME.GENERIC_INCOME',
        link : '/primary_cash/income/generic/'
      }
    ];

    configuration.expense = [
      {
        key : 'PRIMARY_CASH.EXPENSE.PURCHASE',
        link : '/primary_cash/expense/purchase/'
      },
      {
        key : 'PRIMARY_CASH.EXPENSE.GENERIC_TITLE',
        link : '/primary_cash/expense/generic/'
      }
    ];
    
    validate.process(dependencies)
      .then(parseDependenciesData)
      .then(readConfiguration)
      .then(parseConfiguration)
      .then(initialise);
  
    function parseDependenciesData(model) {
      angular.extend($scope, model);
      return $q;
    }

    function readConfiguration() {
      return cache.fetch('cash_box');
    }

    function parseConfiguration(cashbox) {
      var currentModel = $scope.cashBox;
      var configurationExists, validConfiguration;
    
      configurationExists = angular.isDefined(cashbox);
      if (!configurationExists) {
        session.configure = true;
        return;
      }

      validConfiguration = angular.isDefined(currentModel.get(cashbox.id));
      if (!validConfiguration) {
        session.configure = true;
        return;
      }
      
      session.cashbox = cashbox;
      session.complete = true;
      return;
    }

    function initialise() {
      // Initialise
    }

    function loadPath(path) {

      //TODO validate both correct path and cashbox
      $location.path(path + session.cashbox);
    }

    function setConfiguration (cashbox) {
      cache.put('cash_box', cashbox);
      session.configure = false;
      session.complete = true;
      session.cashbox = cashbox;
    }

    function reconfigure() {
      cache.remove('cash_box');
      session.cashbox = null;
      session.configure = true;
      session.complete = false;
    }

    $scope.loadPath = loadPath;
    $scope.setConfiguration = setConfiguration;
    $scope.reconfigure = reconfigure;
  }
]);
