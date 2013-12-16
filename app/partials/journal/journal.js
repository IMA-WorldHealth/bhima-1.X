angular.module('kpk.controllers')

.controller('journalController', function($scope, $translate, $compile, $timeout, $filter, $q, $modal, $http, $location, message, connect) {
  // This is the posting journal and perhaps the heaviest
  // module in Kapok.  It is responsible for posting to
  // the general ledger via a trial balance

  'use strict';

  $scope.model = {};
  $scope.model.journal = {'data' : [] };

//  Request
  var journal_request = {
    'tables' : {
      'posting_journal' : {
        'columns' : ["id", "trans_id", "trans_date", "doc_num", "description", "account_id", "debit", "credit", "currency_id", "deb_cred_id", "deb_cred_type", "inv_po_id", "debit_equiv", "credit_equiv"]
      }
    }
  };

  //TODO iterate thorugh columns array - apply translate to each heading and update
  //(each should go through translate initially as well)
  $scope.$on('$translateChangeSuccess', function () {
    //grid.updateColumnHeader("trans_id", $translate('GENERAL_LEDGER'));
  });

//  grid options
  var grid;
  var dataview;
  var sort_column = "trans_id";
  var columns = [
    {id: 'trans_id', name: "ID", field: 'trans_id', sortable: true},
    {id: 'trans_date', name: 'Date', field: 'trans_date', formatter: formatDate},
    {id: 'doc_num', name: 'Doc No.', field: 'doc_num', maxWidth: 75},
    {id: 'description', name: 'Description', field: 'description', width: 110},
    {id: 'account_id', name: 'Account ID', field: 'account_id', sortable: true},
    {id: 'debit', name: 'Debit', field: 'debit', groupTotalsFormatter: totalFormat, sortable: true, maxWidth:100},
    {id: 'credit', name: 'Credit', field: 'credit', groupTotalsFormatter: totalFormat, sortable: true, maxWidth: 100},
    {id: 'deb_cred_id', name: 'AR/AP Account', field: 'deb_cred_id'},
    {id: 'deb_cred_type', name: 'AR/AP Type', field: 'deb_cred_type'},
    {id: 'inv_po_id', name: 'Inv/PO Number', field: 'inv_po_id'},
    {id: 'del', name: '', width: 10, formatter: formatBtn}
  ];


  var options = {
    enableCellNavigation: true,
    enableColumnReorder: true,
    forceFitColumns: true,
    rowHeight: 30
  };

  function init() {

    connect.req(journal_request).then(function(res) {
      $scope.model['journal'] = res;

      var groupItemMetadataProvider = new Slick.Data.GroupItemMetadataProvider();
      dataview = new Slick.Data.DataView({
        groupItemMetadataProvider: groupItemMetadataProvider,
        inlineFilter: true
      });
      grid = new Slick.Grid('#journal_grid', dataview, columns, options);

      grid.registerPlugin(groupItemMetadataProvider);
//      Cell selection
//      grid.setSelectionModel(new Slick.CellSelectionModel());

      grid.onSort.subscribe(function(e, args) {
        sort_column = args.sortCol.field;
        dataview.sort(compareSort, args.sortAsc);
      });

      dataview.onRowCountChanged.subscribe(function (e, args) {
        grid.updateRowCount();
        grid.render();
      });

      dataview.onRowsChanged.subscribe(function (e, args) {
        grid.invalidateRows(args.rows);
        grid.render();
      });

//      Set for context menu column selection
//      var columnpicker = new Slick.Controls.ColumnPicker(columns, grid, options);

      dataview.beginUpdate();
      dataview.setItems($scope.model['journal'].data);
//      $scope.groupByID()
      dataview.endUpdate();

      // allow the user to select only certain columns shown
      $scope.columns = angular.copy(columns).map(function (column) {
        column.visible = true;
        return column;
      });

    });

  }

  $scope.$watch('columns', function () {
    if (!$scope.columns) return;
    var columns = $scope.columns.filter(function (column) {
      return column.visible;
    });
    grid.setColumns(columns);
  }, true);

  $scope.groupByID = function groupByID () {
    dataview.setGrouping({
      getter: "trans_id",
      formatter: function (g) {
        return "<span style='font-weight: bold'>" + g.value + "</span> (" + g.count + " transactions)</span>";
      },
      aggregators: [
        new Slick.Data.Aggregators.Sum("debit"),
        new Slick.Data.Aggregators.Sum("credit")
      ],
      aggregateCollapsed: true
    });
  };

  $scope.groupByAccount = function groupByAccount () {
    dataview.setGrouping({
      getter: "account_id",
      formatter: function(g) {
        return "<span style='font-weight: bold'>" + g.value + "</span>";
      },
      aggregators: [
        new Slick.Data.Aggregators.Sum("debit"),
        new Slick.Data.Aggregators.Sum("credit")
      ],
      aggregateCollapsed: false
    });
  };

  $scope.removeGroup = function removeGroup() {
    dataview.setGrouping({});
  };

  $scope.trial = function () {
    // in Sanru Tracker, posting encompasses the entire posting journal.
    // This code assumes you are posting everything in the posting journal
    // with your user name.
    // DECISION: Should we allow you to post only some transactions?
    connect.fetch('/trial/')
    .then(function (data) {
      var instance = $modal.open({
        templateUrl:'trialBalanceModal.html',
        controller: 'trialBalanceCtrl',
        resolve : {
          request: function () {
            return data;
          }
        }
      });
      instance.result.then(function () {
        console.log("modal closed successfully.");
        $location.path('/reports/ledger/general_ledger');
      }, function () {
        console.log("modal closed.");
      });
    }, function (data, status) {
      console.log("data:", data);
    });
  };

  function compareSort(a, b) {
    var x = a[sort_column], y = b[sort_column];
    return (x == y) ? 0 : (x > y ? 1 : -1);
  }

  function formatDate (row, col, item) {
    return $filter('date')(item);
  }

  function formatBtn() {
    return "<a class='ng-scope' ng-click='splitTransaction()'><span class='glyphicon glyphicon-th-list'></span></a>";
  }

  function totalFormat(totals, column) {

    var format = {};
    format['Credit'] = '#02BD02';
    format['Debit'] = '#F70303';

    var val = totals.sum && totals.sum[column.field];
    if (val !== null) {
      return "<span style='font-weight: bold; color:" + format[column.name] + "'>" + ((Math.round(parseFloat(val)*100)/100)) + "</span>";
    }
    return "";
  }

  $scope.splitTransaction = function splitTransaction() {
    console.log("func is called");
    var instance = $modal.open({
      templateUrl: "split.html",
      controller: function ($scope, $modalInstance) { //groupStore, accountModel
        console.log("Group module initialised");
      },
      resolve: {
        //groupStore: function () { return stores.inv_group; },
        //accountModel: function () { return $scope.models.account; }
      }
    });
  };

  //good lawd hacks
  //FIXME: without a delay of (roughly)>100ms slickgrid throws an error saying CSS can't be found
//  $timeout(init, 100);


  init();
})

.controller('trialBalanceCtrl', function ($scope, $modalInstance, request, connect) {
  $scope.data = request.data;
  $scope.data.status = request.status;

  $scope.ok = function () {
    connect.fetch('/post/')
    .then(function () {
      $modalInstance.close();
    }, function (error) {
      data.errors = error;
    });
  };

  $scope.cancel = function () {
    $modalInstance.dismiss();
  };
});
