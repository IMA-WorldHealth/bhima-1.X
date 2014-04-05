angular.module('kpk.controllers')
.controller('journal.utilities', [
  '$scope',
  '$translate',
  '$location',
  '$modal',
  '$filter',
  '$timeout',
  'precision',
  'appcache',
  'connect',
  'validate',
  'appstate',
  'messenger',
  function ($scope, $translate, $location, $modal, $filter, $timeout, precision, Appcache, connect, validate, appstate, messenger) {
    var dependencies = {};
    var columns, options, dataview, grid, manager, deleteColumn;
    var cache = new Appcache('journal.utilities');

    // Three modes : { "lock", "static", "edit" }
    // "static" -> pj at rest, default
    // "lock" -> pj locked, can still toggle edit mode, waiting orders
    // "edit" -> editing: must save before unlocking, all features locked.

    $scope.aggregates = true;
    $scope.hasData = false;
    $scope.filter = {};

    // TODO : both journal.utilities and journal.controls use this
    // table.  Use promises to share the data between the two controllers
    dependencies.account = {
      query : {
        'tables' : {
          'account' : { 'columns' : ['id', 'account_number', 'account_type_id', 'account_txt'] }
        },
        identifier: 'account_number'
      }
    };

    appstate.register('journal.ready', function (ready) {
      ready.then(function (params) {
        grid = params[0];
        columns = params[1];
        dataview = params[2];
        options = params[3];
        manager = params[4];
        $scope.hasData = !!dataview.getItems().length;
        return validate.process(dependencies);
      })
      .then(initialise)
      .catch(handleErrors);
    });

    cache.fetch('columns')
    .then(function (columns) {
      if (!columns) { return; }
      $scope.columns = columns;
    });

    function initialise (models) {
      for (var k in models) { $scope[k] = models[k]; }

      // check for cache read
      if (!$scope.columns) {
        $scope.columns = angular.copy(columns);
        $scope.columns.forEach(function (column) { column.visible = true; });
      }

      $scope.groupBy('transaction');

      $scope.session = manager.session;
      manager.session.authenticated = false;
      manager.session.mode = "static";

      // expose regrouping method to other scopes
      manager.fn.regroup = function () {
        if ($scope.grouping) { $scope.groupBy($scope.grouping); }
      };

      manager.fn.toggleEditMode = function () {
        $scope.toggleEditMode();
      };

      manager.fn.resetManagerSession = function () {
        $scope.resetManagerSession();
      };

      manager.fn.showDeleteButton = function () {
        showDeleteButton();
      };
    }

    function btnFormatter (row,cell,value,columnDef,dataContext) {
      var id = dataContext.trans_id;
      if (manager.session.transactionId === id) {
        return "<div class='deleteRow' style='cursor: pointer;'><span class='glyphicon glyphicon-trash deleteRow'></span></div>";
      }
      return "";
    }

    deleteColumn = {
      id        : 'deleteRecord',
      field     : 'delete',
      formatter : btnFormatter,
      width: 10
    };

    function showDeleteButton () {
      var columns = grid.getColumns();
      var hasDeleteButton = columns.some(function (col) { return col.id === 'deleteRecord'; });
      if (hasDeleteButton) { return; }
      columns.push(deleteColumn);
      grid.setColumns(columns);
    }

    function handleErrors (error) {
      messenger.danger('An error occured ' + JSON.stringify(error));
    }

    $scope.removeGroup = function removeGroup () {
      dataview.setGrouping();
    };

    $scope.trialBalance = function () {
      // Runs the trial balance
      // first, we need to validate that all items in each trans have been
      // selected.

      connect.fetch('/trialbalance/initialize')
      .then(function (res) {
        var instance = $modal.open({
          backdrop: 'static', // this should not close on off click
          keyboard : false,   // do not let esc key close modal
          templateUrl:'partials/journal/trialbalance/trialbalance.html',
          controller: 'trialBalance',
          resolve : {
            request: function () {
              return res.data;
            }
          }
        });

        instance.result.then(function () {
          $location.path('/reports/ledger/general_ledger');
        });
      })
      .catch(function (error) {
        messenger.danger('Trial Balance failed with ' + JSON.stringify(error));
      });
    };

    $scope.groupBy = function groupBy(targetGroup) {
      $scope.grouping = targetGroup;

      function groupByTransaction() {
        dataview.setGrouping({
          getter: "trans_id",
          formatter: formatTransactionGroup,
          comparer : function (a, b) {
            var x =  parseFloat(a.groupingKey.substr(3));
            var y =  parseFloat(b.groupingKey.substr(3));
            return x > y ? 1 : -1;
          },
          aggregators: [
            new Slick.Data.Aggregators.Sum("debit"),
            new Slick.Data.Aggregators.Sum("credit"),
            new Slick.Data.Aggregators.Sum("debit_equiv"),
            new Slick.Data.Aggregators.Sum("credit_equiv")
          ],
          aggregateCollapsed: $scope.aggregates,
          lazyTotalsCalculation : true
        });
      }

      function groupByAccount () {
        dataview.setGrouping({
          getter: "account_id",
          formatter: function(g) {
            var account_txt = $scope.account.get(g.rows[0].account_number).account_txt || "";
            return "<span style='font-weight: bold'>" + ( $scope.account ? account_txt : g.value) + "</span>";
          },
          aggregators: [
            new Slick.Data.Aggregators.Sum("debit"),
            new Slick.Data.Aggregators.Sum("credit"),
            new Slick.Data.Aggregators.Sum("debit_equiv"),
            new Slick.Data.Aggregators.Sum("credit_equiv")
          ],
          lazyTotalsCalculation : true,
          aggregateCollapsed: $scope.aggregates
        });
      }

      var groupMap = {
        'transaction' : groupByTransaction,
        'account' : groupByAccount
      };

      if (groupMap[targetGroup]) { groupMap[targetGroup](); }
    };

    function formatTransactionGroup(g) {
      var rowMarkup,
          editTemplate = "";

      var correctRow = g.rows.every(function (row) {
        return row.trans_id === manager.session.transactionId;
      });

      if (manager.session.mode === "lock") {
        editTemplate = "<div class='pull-right'><a class='editTransaction' style='color: white; cursor: pointer;'><span class='glyphicon glyphicon-pencil'></span> " + $translate("POSTING_JOURNAL.EDIT_TRANSACTION") + " </a></div>";
      }

      if (manager.session.mode === "edit" && correctRow) {
        rowMarkup =
          "<span style='color: white;'>" +
          "  <span style='color: white;' class='glyphicon glyphicon-warning-sign'> </span> " +
          $translate("POSTING_JOURNAL.LIVE_TRANSACTION") + " <strong>"  + g.value + "</strong> (" + g.count + " records)" +
          "</span> " +
          "<span class='pull-right'>" +
          //"  <a class='addRow' style='color: white; cursor: pointer;'> <span class='glyphicon glyphicon-plus'></span>  " + $translate('POSTING_JOURNAL.ADD_ROW') + "</a>" +
          "  <a class='addRow' style='color: white; cursor: pointer;'> <span class='glyphicon glyphicon-plus addRow'></span>  " + "</a>" +
          "  <span style='padding: 5px;'></span>" + // FIXME Hacked spacing;
          //"  <a class='saveTransaction' style='color: white; cursor: pointer;'> <span class='glyphicon glyphicon-floppy-disk'></span>  " + $translate('POSTING_JOURNAL.SAVE_TRANSACTION') + "</a>" +
          "  <a class='save' style='color: white; cursor: pointer;'> <span class='glyphicon glyphicon-floppy-disk saveTransaction'></span>  " + "</a>" +
          "  <span style='padding: 5px;'></span>" + // FIXME Hacked spacing;
          "  <a class='save' style='color: white; cursor: pointer;'> <span class='glyphicon glyphicon-trash deleteTransaction'></span>  </a>" +
          //"  <a class='deleteTransaction' style='color: white; cursor: pointer;'> <span class='glyphicon glyphicon-trash'></span>  " + $translate('POSTING_JOURNAL.DELETE_TRANSACTION') + "</a>" +
          "</span>";
        return rowMarkup;
      }

      rowMarkup = "<span style='font-weight: bold'>" + g.value + "</span> (" + g.count + " records)</span>";
      rowMarkup += editTemplate;
      return rowMarkup;
    }

    $scope.print = function () {
      $location.path('/print/journal');
    };

    // Toggle column visibility
    $scope.$watch('columns', function () {
      if (!$scope.columns) return;
      var columns = $scope.columns.filter(function (column) { return column.visible; });
      //cache.put('columns', columns);
      grid.setColumns(columns);
    }, true);

    function authenticate () {
      return $modal.open({
        backdrop: 'static', // this should not close on off click
        keyboard : false,   // do not let esc key close modal
        templateUrl:'partials/journal/journal.auth.html',
        controller: 'journal.auth',
      });
    }

    $scope.$watch('session.mode', function (nv, ov) {
      if (!manager || !manager.session || !manager.session.mode) { return; }
      var e = $("#journal_grid");
      e[manager.session.mode === "static" ? 'removeClass' : 'addClass']('danger');
      manager.fn.regroup();
    });

    function beginEditMode () {
      if (manager.session.authenticated) {
        manager.mode = $scope.mode = "lock";
      } else {
        authenticate()
        .result
        .then(function (result) {
          if (result.authenticated) {
            manager.session.authenticated = result.authenticated;
            manager.session.uuid = result.uuid;
            manager.session.start = result.timestamp;
            manager.session.justification = result.justification;
            manager.session.mode = $scope.session.mode = "lock";
          }
          manager.fn.regroup();
        })
        .catch(function () { messenger.warning('Edit session closed.'); });
      }
    }

    function endEditMode () {
      $scope.session = manager.session = { authenticated : false, mode : "static" };
    }

    $scope.toggleEditMode = function () {
      if (manager.session.mode === "edit") { return; }
      return manager.session.mode === "static" ? beginEditMode() : endEditMode();
    };

    $scope.resetManagerSession = function resetManagerSession () {
      $scope.session = manager.session = { authenticated : false, mode : "static" };
    };

    $scope.toggleAggregates = function toggleAggregates () {
      $scope.aggregates =! $scope.aggregates;
      manager.fn.regroup();
    };


  }
]);
