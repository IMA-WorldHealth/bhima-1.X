angular.module('kpk.controllers')
.controller('journal.utilities', [
  '$scope',
  '$translate',
  '$location',
  '$modal',
  '$filter',
  'precision',
  'appcache',
  'connect',
  'validate',
  'appstate',
  'messenger',
  function ($scope, $translate, $location, $modal, $filter, precision, Appcache, connect, validate, appstate, messenger) {
    var dependencies = {};
    var columns, options, dataview, grid, manager;
    var cache = new Appcache('journal.utilities');

    $scope.aggregates = true;
    $scope.hasData = false;
    $scope.editing = false;
    $scope.editorLock = false;

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

      // expose regrouping method to other scopes
      manager.regroup = function () {
        if ($scope.grouping) { $scope.groupBy($scope.grouping); }
      };

      manager.toggleEditorLock = function () {
        $scope.editorLock = !$scope.editorLock;
      };

      manager.toggleEditMode = function () {
        $scope.toggleEditMode();
      };
    }

    function handleErrors (error) {
      messenger.danger('An error occured ' + JSON.stringify(error));
    }

    $scope.removeGroup = function removeGroup () {
      dataview.setGrouping({});
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
          editTemplate = "",
          firstElement = g.rows[0];


      if (manager.editable) {
        console.log("manager.editable", manager.editable);
        editTemplate = "<div class='pull-right'><a class='initEditing' style='color: white; cursor: pointer;'><span class='glyphicon glyphicon-pencil'></span> " + $translate("POSTING_JOURNAL.EDIT_TRANSACTION") + " </a></div>";
      }

      if (firstElement.trans_id === manager.transactionId) {
        rowMarkup =
          "<span style='color: white;'>" +
          "  <span style='color: white;' class='glyphicon glyphicon-pencil'> </span> " +
          $translate("POSTING_JOURNAL.LIVE_TRANSACTION") + " "  + g.value + " (" + g.count + " records)" +
          "</span> " +
          "Total Transaction Credit: <b>" + $filter('currency')(manager.origin.credit_equiv) + "</b> " +
          "Total Transaction Debit: <b>" + $filter('currency')(manager.origin.debit_equiv) + "</b> " +
          "<div class='pull-right'>" +
          "  <a class='addRow' style='color: white; cursor: pointer;'><span class='glyphicon glyphicon-plus'></span>  " + $translate('POSTING_JOURNAL.ADD_ROW') + "</a>" +
          "  <span style='padding: 5px;'></span>" + // FIXME Hacked spacing;
          "  <a class='save' style='color: white; cursor: pointer;'> <span class='glyphicon glyphicon-floppy-disk'></span>  " + $translate('POSTING_JOURNAL.SAVE_TRANSACTION') + "</a>" +
          "</div>";
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

    $scope.toggleEditMode = function toggleEditMode () {
      if (manager.state === 'editing') { return; }
      manager.editable =  !manager.editable;
      $scope.editing = !$scope.editing;
      // FIXME: Get angular to do this through two different scopes
      $('#journal_grid').toggleClass('danger');
      $scope.groupBy('transaction');
    };

    $scope.toggleAggregates = function toggleAggregates () {
      $scope.aggregates =! $scope.aggregates;
      manager.regroup();
    };

  }
]);
