var journalUtilitiesController = function ($scope, $translate, $location, $modal, Appcache, connect, validate, appstate, messenger, dataviewService, columnsService, gridService, dataLoaderService, managerService){
  var vm = this, deleteColumn, cache = new Appcache('journal.utilities');
  vm.columnsService = columnsService;
  vm.gridService = gridService;
  vm.dataviewService = dataviewService;
  vm.managerService = managerService;
  vm.aggregates = true;
  vm.hasData = vm.dataviewService.dataview.getItems().length > 0;
  vm.filter = { by : {} };

  vm.dataLoaderService.loadAccountData()
  .then(initialise);

  cache.fetch('columns')
    .then(function (columns) {
      if (!columns) { return; }
      vm.columns = columns;
    });

  function handleErrors (error) {
    console.log(error);
  }

  function initialise(models) {
    for (var k in models) { vm[k] = models[k]; }

      // check for cache read
    if (!vm.columns) {
      vm.columns = angular.copy(vm.columns);
      vm.columns.forEach(function (column) { column.visible = true; });
    }

    vm.groupBy('transaction');

    vm.session = vm.managerService.manager.session;
    vm.managerService.manager.session.authenticated = false;
    vm.managerService.manager.session.mode = 'static';

    vm.dataviewService.dataview.beginUpdate();
    vm.dataviewService.dataview.setFilter(filter);
    vm.dataviewService.dataview.setFilterArgs({
      param : ''
    });
    vm.dataviewService.dataview.endUpdate();

    // expose regrouping method to other scopes
    vm.managerService.manager.fn.regroup = function () {
      if (vm.grouping) { vm.groupBy($scope.grouping); }
    };

    vm.managerService.manager.fn.toggleEditMode = function () {
      vm.toggleEditMode();
    };

    vm.managerService.manager.fn.resetManagerSession = function () {
      vm.resetManagerSession();
    };

    vm.managerService.manager.fn.showDeleteButton = function () {
      showDeleteButton();
    };
  }

  vm.groupBy = function groupBy(targetGroup) {
    vm.grouping = targetGroup;

    function groupByTransaction() {
      vm.dataviewService.dataview.setGrouping({
        getter: 'trans_id',
        formatter: formatTransactionGroup,
        comparer : function (a, b) {
          var x =  parseFloat(a.groupingKey.substr(3));
          var y =  parseFloat(b.groupingKey.substr(3));
          return x > y ? 1 : -1;
        },
        aggregators: [
          new Slick.Data.Aggregators.Sum('debit'),
          new Slick.Data.Aggregators.Sum('credit'),
          new Slick.Data.Aggregators.Sum('debit_equiv'),
          new Slick.Data.Aggregators.Sum('credit_equiv')
        ],
        aggregateCollapsed: vm.aggregates,
        lazyTotalsCalculation : true
      });
    }

    function groupByAccount () {
      this.dataviewService.dataview.setGrouping({
        getter: 'account_id',
        formatter: function(g) {
          var account_txt = $scope.account.get(g.rows[0].account_number).account_txt || '';
          return '<span style="font-weight: bold">' + ( $scope.account ? account_txt : g.value) + '</span>';
        },
        aggregators: [
          new Slick.Data.Aggregators.Sum('debit'),
          new Slick.Data.Aggregators.Sum('credit'),
          new Slick.Data.Aggregators.Sum('debit_equiv'),
          new Slick.Data.Aggregators.Sum('credit_equiv')
        ],
        lazyTotalsCalculation : true,
        aggregateCollapsed: $scope.aggregates
      });
    }

    function unGroup () {
      vm.dataviewService.dataview.setGrouping({});
    }

    var groupMap = {
      'transaction' : groupByTransaction,
      'account' : groupByAccount,
      'ungroup' : unGroup
    };

    if (groupMap[targetGroup]) { groupMap[targetGroup](); }
  };

  function formatTransactionGroup(g) {
    var rowMarkup,
        editTemplate = '';

    var correctRow = g.rows.every(function (row) {
      return row.trans_id === vm.managerService.manager.session.transactionId;
    });

    if (vm.managerService.manager.session.mode === 'lock') {
      editTemplate = '<div class="pull-right"><a class="editTransaction" style="color: white; cursor: pointer;"><span class="glyphicon glyphicon-pencil"></span> ' + $translate.instant('POSTING_JOURNAL.EDIT_TRANSACTION') + ' </a></div>';
    }

    if (vm.managerService.manager.session.mode === 'edit' && correctRow) {
      rowMarkup =
        '<span style="color: white;">' +
        '  <span style="color: white;" class="glyphicon glyphicon-warning-sign"> </span> ' +
        $translate.instant('POSTING_JOURNAL.LIVE_TRANSACTION') + ' <strong>'  + g.value + '</strong> (' + g.count + ' records)' +
        '</span> ' +
        '<span class="pull-right">' +
        //'  <a class='addRow' style='color: white; cursor: pointer;'> <span class='glyphicon glyphicon-plus'></span>  ' + $translate('POSTING_JOURNAL.ADD_ROW') + '</a>' +
        '  <a class="addRow" style="color: white; cursor: pointer;"> <span class="glyphicon glyphicon-plus addRow"></span>  ' + '</a>' +
        '  <span style="padding: 5px;"></span>' + // FIXME Hacked spacing;
        //'  <a class='saveTransaction' style='color: white; cursor: pointer;'> <span class='glyphicon glyphicon-floppy-disk'></span>  ' + $translate('POSTING_JOURNAL.SAVE_TRANSACTION') + '</a>' +
        '  <a class="save" style="color: white; cursor: pointer;"> <span class="glyphicon glyphicon-floppy-disk saveTransaction"></span>  ' + '</a>' +
        '  <span style="padding: 5px;"></span>' + // FIXME Hacked spacing;
        '  <a class="save" style="color: white; cursor: pointer;"> <span class="glyphicon glyphicon-trash deleteTransaction"></span>  </a>' +
        //'  <a class='deleteTransaction' style='color: white; cursor: pointer;'> <span class='glyphicon glyphicon-trash'></span>  ' + $translate('POSTING_JOURNAL.DELETE_TRANSACTION') + '</a>' +
        '</span>';
      return rowMarkup;
    }

    rowMarkup = '<span style="font-weight: bold">' + g.value + '</span> (' + g.count + ' records)</span>';
    rowMarkup += editTemplate;
    return rowMarkup;
  }

  function filter(item, args) {
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

  function formatDate(d) {
    var month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) { month = '0' + month; }
    if (day.length < 2) { day = '0' + day; }

    return [year, month, day].join('-');
  }

  vm.toggleEditMode = function () {
    if (this.managerService.manager.session.mode === 'edit') { return; }
    return this.managerService.manager.session.mode === 'static' ? beginEditMode() : endEditMode();
  };

  function beginEditMode () {
    if (vm.managerService.manager.session.authenticated) {
      vm.managerService.manager.mode = vm.mode = 'lock';
    } else {
      authenticate()
      .result
      .then(function (result) {
        if (result.authenticated) {
          vm.managerService.manager.session.authenticated = result.authenticated;
          vm.managerService.manager.session.uuid = result.uuid;
          vm.managerService.manager.session.start = result.timestamp;
          vm.managerService.manager.session.justification = result.justification;
          vm.managerService.manager.session.mode = $scope.session.mode = 'lock';
        }
        vm.managerService.manager.fn.regroup();
      })
      .catch(function () {
        messenger.warn({ namespace : 'JOURNAL', description : 'Edit session closed.' });
      });
    }
  }

  function endEditMode () {
    vm.session = this.managerService.manager.session = { authenticated : false, mode : 'static' };
  }

  function authenticate () {
    return $modal.open({
      backdrop: 'static', // this should not close on off click
      keyboard : false,   // do not let esc key close modal
      templateUrl:'partials/journal/journal.auth.html',
      controller: 'journal.auth',
    });
  }

  function btnFormatter (row,cell,value,columnDef,dataContext) {
    var id = dataContext.trans_id;
    if (vm.managerService.manager.session.transactionId === id) {
      return '<div class="deleteRow" style="cursor: pointer;"><span class="glyphicon glyphicon-trash deleteRow"></span></div>';
    }
    return '';
  }

  deleteColumn = {
    id        : 'deleteRecord',
    field     : 'delete',
    formatter : btnFormatter,
    width: 10
  };

  function showDeleteButton () {
    var columns = gridService.grid.getColumns();
    var hasDeleteButton = columns.some(function (col) { return col.id === 'deleteRecord'; });
    if (hasDeleteButton) { return; }
    columns.push(deleteColumn);
    vm.gridService.grid.setColumns(columns);
  }

  vm.removeGroup = function removeGroup () {
    vm.dataviewService.dataview.setGrouping();
  };

  vm.refreshFilter = function refreshFilter () {
    vm.filter.param = '';
    vm.dataviewService.dataview.setFilterArgs({
      param : vm.filter.param
    });
    vm.dataviewService.dataview.refresh();
  };

  vm.print = function () {
    $location.path('/journal/print');
  };

    // Toggle column visibility
    // this is terrible
  $scope.$watch('columns', function () {
    if (!vm.columns) { return; }
    var columns = vm.columns.filter(function (column) { return column.visible; });
    //cache.put('columns', columns);
    vm.gridService.grid.setColumns(columns);
  }, true);

  $scope.$watch('session.mode', function () {
    if (!vm.managerService.manager || !vm.managerService.manager.session || !vm.managerService.manager.session.mode) { return; }
    var e = $('#journal_grid');
    e[vm.managerService.manager.session.mode === 'static' ? 'removeClass' : 'addClass']('danger');
    vm.managerService.manager.fn.regroup();
  });

  vm.resetManagerSession = function resetManagerSession () {
    vm.session = vm.managerService.manager.session = { authenticated : false, mode : 'static' };
  };

  vm.toggleAggregates = function toggleAggregates () {
    vm.aggregates =! vm.aggregates;
    vm.managerService.manager.fn.regroup();
  };

  vm.updateFilter = function updateFilter () {
  // TODO : make this update when there is no data in filter.param
    if (!vm.filter.param) { return; }
    if (!vm.filter.by) { return; }
    vm.dataviewService.dataview.setFilterArgs({
      param : vm.filter.param,
      re    : new RegExp(vm.filter.param, 'i') // 'i' for ignore case
    });
    vm.dataviewService.dataview.refresh();
  };

  $scope.$watch('filter', vm.updateFilter, true);

  // $scope.trialBalance = function () {

  //   var l = dataview.getLength(),
  //       transactions = [];

  //   // loop through the current view and add all the transactions
  //   // you find to the list of transactions for posting to
  //   // the general ledger
  //   // NOTE : MUST BE GROUPED BY TRANS_ID
  //   for (var i = 0; i < l; i++) {
  //     var item = dataview.getItem(i);
  //     if (item.__group) {
  //       transactions.push(item.value);
  //     }
  //   }

  //   // The modal should make the relevant $http requests so that the client is
  //   // not confused as to what is happening.  A loading dialog can be displayed
  //   // on the modal to ensure that everything is fine.
  //   var modal = $modal.open({
  //     backdrop: 'static', // this should not close on off click
  //     keyboard : false,   // do not let esc key close modal
  //     templateUrl:'partials/journal/trialbalance/trialbalance.html',
  //     controller: 'TrialBalanceController as BalanceCtrl',
  //     resolve : {
  //       transactions : function () {
  //         return transactions;
  //       }
  //     }
  //   });

  //   modal.result.then(function () {
  //     $location.path('/reports/ledger/general_ledger');
  //   });
  // };


};

journalUtilitiesController.$inject = ['$scope', '$translate', '$location', '$modal', 'appcache', 'connect', 'validate', 'appstate', 'messenger',  'JournalDataviewService', 'JournalColumnsService', 'JournalGridService', 'JournalDataLoaderService', 'JournalManagerService'];
angular.module('bhima.controllers').controller('journal.utilities', journalUtilitiesController);
