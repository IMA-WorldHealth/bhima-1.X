var journalUtilitiesController = function ($scope, $translate, $location, $modal, Appcache, connect, validate, appstate, messenger, dataviewService, columnsService, gridService, dataLoaderService, managerService){
  var vm = this, cache = new Appcache('journal.utilities');

  vm.columnsService = columnsService;
  vm.gridService = gridService;
  vm.dataviewService = dataviewService;
  vm.managerService = managerService;
  vm.dataLoaderService = dataLoaderService; 
  // vm.hasData = vm.dataviewService.hasData(); //FIX ME : this line is executed before de the dataview is populated
  $scope.filter = vm.filter = { by : {} };
  

  vm.dataLoaderService.loadAccountData()
    .then(function(data){
      initialise(data);
    });
  cache.fetch('columns')
    .then(function (columns) {
      if (!columns) { return; }
      $scope.columns = vm.columns = columns;
    });

  function initialise(models) {
    vm.dataLoaderService.SetAccountStore(models.account); //FIX ME not logic
    for (var k in models) { vm[k] = models[k]; }
      // check for cache read
    if (!vm.columns) {
      vm.columns = angular.copy(vm.columnsService.columns);
      vm.columns.forEach(function (column) { column.visible = true; });
    }

    groupBy('transaction');

    vm.managerService.setAuthenticated(false);
    vm.managerService.setMode('static');
    vm.session = vm.managerService.getSession();
    vm.dataviewService.setFilter(filter, '');    

    // vm.managerService.manager.fn.toggleEditMode = function () {
    //   vm.toggleEditMode();
    // };

    // vm.managerService.manager.fn.resetManagerSession = function () {
    //   vm.resetManagerSession();
    // };

    // vm.managerService.manager.fn.showDeleteButton = function () {
    //   showDeleteButton();
    // };
  }

  function groupBy (type){
    vm.dataviewService.groupBy(type);
  }

  function formatDate(d) {
    var month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) { month = '0' + month; }
    if (day.length < 2) { day = '0' + day; }

    return [year, month, day].join('-');
  }

  function filter(item, args) {
    // console.log('filter function', item, args);
    var value,
        re = args.re;

    // if there is no filter, let everything through
    if (!vm.filter.by.field) {  return true; }

    value = item[vm.filter.by.field];

    // if we are searching for trans_date, it will be in
    // ISO format.  Just split it and compare!
    if (vm.filter.by.field === 'trans_date') {
      var p = formatDate(value).substr(0, args.param.length);
      return p === args.param;
    }

    // if matches regex, let it through
    return re.test(String(value));
  }

  function handleErrors (error) {
    console.log(error);
  }

  function toggleEditMode () {
    if (managerService.getMode() === 'edit') { return; }
    return managerService.getMode() === 'static' ? beginEditMode() : endEditMode();
  }

  function authenticate () {
    return $modal.open({
      backdrop: 'static', // this should not close on off click
      keyboard : false,   // do not let esc key close modal
      templateUrl:'partials/journal/journal.auth.html',
      controller: 'journal.auth',
    });
  }

  function beginEditMode () {
    if (managerService.isAuthenticated()) {
      managerService.setMode('lock');
      vm.mode = managerService.getMode();
    } else {
      authenticate()
      .result
      .then(function (result) {
        if (result.authenticated) {
          managerService.setAuthenticated(result.authenticated);
          managerService.setUuid(result.uuid);
          managerService.setStartTime(result.timestamp);
          managerService.setJustification(result.justification);
          managerService.setMode('lock');
          vm.session.mode = managerService.getMode();
        }
        regroup();
      })
      .catch(function () {
        messenger.warn({ namespace : 'JOURNAL', description : 'Edit session closed.' });
      });
    }
  }

  function endEditMode () {
    managerService.setAuthenticated(false);
    managerService.setMode('static');
    vm.session = managerService.getSession();
  }

  function regroup (){
    if (vm.dataviewService.getGrouping()) { vm.dataviewService.groupBy(vm.dataviewService.getGrouping()); }
  }

  function getGroupingType (){
    return vm.dataviewService.getGrouping();
  }

  function removeGroup () {
    vm.dataviewService.setGrouping();
    vm.dataviewService.groupBy('ungroup');
  }

  function refreshFilter () {
    vm.dataviewService.refreshDataviewFilter();
  }

  function filterBy (col){
    vm.filter.by = col;
  }

  function updateFilter () {
    if (!vm.filter.param) { return; }
    if (!vm.filter.by) { return; }    
    vm.dataviewService.updateFilter(vm.filter.param);
  }

  function print () {
    $location.path('/journal/print');
  }

  function trialBalance () {

    var l = vm.dataviewService.dataview.getLength(),
        transactions = [];

    // loop through the current view and add all the transactions
    // you find to the list of transactions for posting to
    // the general ledger
    // NOTE : MUST BE GROUPED BY TRANS_ID
    for (var i = 0; i < l; i++) {
      var item = vm.dataviewService.dataview.getItem(i);
      if (item.__group) {
        transactions.push(item.value);
      }
    }

    // The modal should make the relevant $http requests so that the client is
    // not confused as to what is happening.  A loading dialog can be displayed
    // on the modal to ensure that everything is fine.
    var modal = $modal.open({
      backdrop: 'static', // this should not close on off click
      keyboard : false,   // do not let esc key close modal
      templateUrl:'partials/journal/trialbalance/trialbalance.html',
      controller: 'TrialBalanceController as BalanceCtrl',
      resolve : {
        transactions : function () {
          return transactions;
        }
      }
    });

    modal.result.then(function () {
      $location.path('/reports/ledger/general_ledger');
    });
  }

  vm.regroup = regroup;
  vm.groupBy = groupBy;
  vm.removeGroup = removeGroup;
  vm.toggleEditMode = toggleEditMode;
  vm.refreshFilter = refreshFilter;
  vm.updateFilter = updateFilter;
  vm.filterBy = filterBy;
  vm.getGroupingType = getGroupingType;
  vm.print = print; 
  vm.trialBalance = trialBalance;
  

  $scope.$watch('filter', function () {
    updateFilter();
  }, true);

  $scope.$watch('columns', function () {
    if (!$scope.columns) { return; }
    var columns = $scope.columns.filter(function (column) { return column.visible; });
   
    cache.put('columns', columns);
    vm.gridService.applyColumns(columns); 
  }, true);

  $scope.$watch('session.mode', function () {
    if (!vm.managerService.getManager() || !vm.managerService.getSession() || !vm.managerService.getMode()) { return; }
    var e = $('#journal_grid');
    e[vm.managerService.getMode() === 'static' ? 'removeClass' : 'addClass']('danger');
    regroup();
  });

  // function toggleAggregates () {
  //   // dataviewService.getAggregate() =! vm.aggregates;
  //   regroup();
  // } 

  // vm.toggleAggregates = toggleAggregates; 

  // vm.resetManagerSession = function resetManagerSession () {
  //   vm.session = vm.managerService.manager.session = { authenticated : false, mode : 'static' };
  // };
};
journalUtilitiesController.$inject = ['$scope', '$translate', '$location', '$modal', 'appcache', 'connect', 'validate', 'appstate', 'messenger',  'JournalDataviewService', 'JournalColumnsService', 'JournalGridService', 'JournalDataLoaderService', 'JournalManagerService'];
angular.module('bhima.controllers').controller('journalUtilitiesController', journalUtilitiesController);
