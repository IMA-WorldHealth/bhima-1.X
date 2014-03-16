angular.module('kpk.controllers')
.controller('reportGeneralLedger', [
  '$scope',
  '$q',
  '$filter',
  'connect',
  'appstate',
  'validate',
  function ($scope, $q, $filter, connect, appstate, validate) {

    var dependencies = {};
    var columns, dataview, options, grid, groups = $scope.groups = [];

    dependencies.ledger = {
      query : {
        tables : {
          'general_ledger' : {
            columns : ['uuid', 'fiscal_year_id', 'period_id', 'trans_id', 'trans_date', 'doc_num', 'description', 'account_id', 'debit', 'credit', 'debit_equiv', 'credit_equiv', 'currency_id', 'deb_cred_uuid', 'deb_cred_type', 'inv_po_id', 'comment', 'cost_ctrl_id', 'origin_id', 'user_id']
          },
          'account' : {
            columns : ['account_number']
          }
        },
        join : ['general_ledger.account_id=account.id'],
      }
    };

    function buildLedgerQuery(enterprise) {
      dependencies.ledger.where = ['general_ledger.enterprise_id='+enterprise.id];
      validate.process(dependencies).then(reportGeneralLedger);
    }

    appstate.register('enterprise', buildLedgerQuery);

    function reportGeneralLedger(model) {
      $scope.model = model;

      settupGridOptions();
      initialiseGrid();
    }

    function settupGridOptions() {
      columns = [
        {id: 'uuid'           , name: $filter('translate')('COLUMNS.ID')             , field:'uuid'           , visible : false} ,
        {id: 'fiscal_year_id' , name: $filter('translate')('COLUMNS.FISCAL_YEAR_ID') , field:'fiscal_year_id' , visible : true } ,
        {id: 'period_id'      , name: $filter('translate')('COLUMNS.PERIOD_ID')      , field:'period_id'      , visible : true } ,
        {id: 'trans_id'       , name: $filter('translate')('COLUMNS.TRANS_ID')       , field:'trans_id'       , visible : true } ,
        {id: 'trans_date'     , name: $filter('translate')('COLUMNS.DATE')           , field:'trans_date'     , visible : true   , formatter: formatDate}  ,
        {id: 'doc_num'        , name: $filter('translate')('COLUMNS.DOCUMENT_ID')    , field:'doc_num'        , visible : true } ,
        {id: 'description'    , name: $filter('translate')('COLUMNS.DESCRIPTION')    , field:'description'    , visible : true } ,
        {id: 'account_number' , name: $filter('translate')('COLUMNS.ACCOUNT_NUMBER') , field:'account_number' , visible : true } ,
        {id: 'debit'          , name: $filter('translate')('COLUMNS.DEBIT')          , field:'debit'          , visible : false  , formatter: formatAmount , groupTotalsFormatter: formatGroupTotalRow}  ,
        {id: 'credit'         , name: $filter('translate')('COLUMNS.CREDIT')         , field:'credit'         , visible : false  , formatter: formatAmount , groupTotalsFormatter: formatGroupTotalRow}  ,
        {id: 'debit_equiv'    , name: $filter('translate')('COLUMNS.DEB_EQUIV')      , field:'debit_equiv'    , visible : true   , formatter: formatEquiv  , groupTotalsFormatter: formatGroupTotalRow } ,
        {id: 'credit_equiv'   , name: $filter('translate')('COLUMNS.CRE_EQUIV')      , field:'credit_equiv'   , visible : true   , formatter: formatEquiv  , groupTotalsFormatter: formatGroupTotalRow}  ,
        {id: 'currency_id'    , name: $filter('translate')('COLUMNS.CURRENCY')       , field:'currency_id'    , visible : false} ,
        {id: 'deb_cred_uuid'  , name: $filter('translate')('COLUMNS.DEBCRED_ID')     , field:'deb_cred_uuid'  , visible : true } ,
        {id: 'deb_cred_type'  , name: $filter('translate')('COLUMNS.DC_TYPE')        , field:'deb_cred_type'  , visible : true } ,
        {id: 'inv_po_id'      , name: $filter('translate')('COLUMNS.INVPO_ID')       , field:'inv_po_id'      , visible : true } ,
        {id: 'comment'        , name: $filter('translate')('COLUMNS.COMMENT')        , field:'comment'        , visible : false} ,
        {id: 'origin_id'      , name: $filter('translate')('COLUMNS.ORIGIN_ID')      , field:'origin_id'      , visible : false} ,
        {id: 'user_id'        , name: $filter('translate')('COLUMNS.USER_ID')        , field:'user_id'        , visible : false}
      ];
      $scope.columns = angular.copy(columns);

      options = {
        enableCellNavigation: true,
        enableColumnReorder: true,
        forceFitColumns: true,
        rowHeight: 35,
      };
    }

    var sort_column;

    function initialiseGrid() {
      var groupItemMetadataProvider = new Slick.Data.GroupItemMetadataProvider();

      dataview = new Slick.Data.DataView({
        groupItemMetadataProvider : groupItemMetadataProvider,
        inlineFilter : true
      });

      dataview.onRowCountChanged.subscribe(function (e, args) {
        grid.updateRowCount();
        grid.render();
      });

      dataview.onRowsChanged.subscribe(function (e, args) {
        grid.invalidateRows(args.rows);
        grid.render();
      });

      grid = new Slick.Grid('#kpk-ledger-general_ledger-grid', dataview, columns, options);
      grid.setSelectionModel(new Slick.RowSelectionModel());

      grid.registerPlugin(groupItemMetadataProvider);

      //Grid sorting
      grid.onSort.subscribe(function(e, args) {
        sort_column = args.sortCol.field;
        dataview.sort(compareSort, args.sortAsc);
      });


      dataview.beginUpdate();
      dataview.setItems($scope.model.ledger.data);
      // dataview.setFilterArgs({
      //   searchStr: flags.searchStr
      // });
      // dataview.setFilter(search);
      dataview.endUpdate();

      dataview.syncGridSelection(grid, true);
    }

    var groupDefinitions = [
      {
        title : "Transaction",
        getter : "trans_id",
        formatter : formatTransactionGroup,
        aggregators : ["debit_equiv", "credit_equiv"]
      },
      {
        title : "Account",
        getter : "account_id",
        formatter : formatAccountGroup,
        aggregators : []
      },
      {
        title : "Period",
        getter : "period_id",
        formatter : formatPeriodGroup,
        aggregators : []
      }
    ];

    //Utility methods
    function groupby(groupDefinition) {
      var groupInstance = {};
      if(groupExists(groupDefinition, groups)) return;

      groupInstance = JSON.parse(JSON.stringify(groupDefinition));
      groupInstance.aggregateCollapsed = true;
      groupInstance.aggregators = [];

      groupDefinition.aggregators.forEach(function(aggregate) {
        groupInstance.aggregators.push(new Slick.Data.Aggregators.Sum(aggregate));
      });

      groupInstance.formatter = groupDefinition.formatter;
      groups.push(groupInstance);
      dataview.setGrouping(groups);
    }

    function groupExists(targetGroup, groupList) {
      return groups.some(function(group) {
        return group.getter === targetGroup.getter;
      });
    }

    function formatTransactionGroup(g) {
      return "<span>TRANSACTION(" + g.value + ")</span>";
    }

    function formatAccountGroup(g) {
      return "<span>ACCOUNT(" + g.value + ")</span>";
    }

    function formatPeriodGroup(g) {
      return "<span>PERIOD(" + g.value + ")</span>";
    }

    function formatGroupTotalRow(totals, column) {
      var val = totals.sum && totals.sum[column.field];
      if(val!==null) return "<span style='font-weight: bold'>" + $filter('currency')(Math.round(parseFloat(val)*100/100)) + "</span>";
      return "";
    }

    //Grid sort methods
    function compareSort(a, b) {
      var x = a[sort_column], y = b[sort_column];
      return (x === y) ? 0 : (x > y ? 1 : -1);
    }

    function search (item, args) {
      if (item.searchStr !== "" &&
          String(item.account_number).indexOf(args.searchStr) === -1 &&
          String(item.trans_id).indexOf(args.searchStr) === -1 &&
          String(item.deb_cred_uuid).indexOf(args.searchStr) === -1
          ) {
        return false;
      }
      return true;
    }

    //Grid formats
    function formatAmount(row, cell, value) {
      return $filter('currency')(value);
    }

    function formatEquiv(row, cell, value) {
      return $filter('currency')(value);
    }

    function formatDate (row, cell, value) {
      return $filter('date')(value);
    }

    //Update grid on filter/settings changes
    /*$scope.$watch('flags.searchStr', function () {
      if(!dataview) return;
      if (!flags.searchStr) flags.searchStr = ""; //prevent default
      dataview.setFilterArgs({
        searchStr: flags.searchStr
      });
      dataview.refresh();
    });*/

    $scope.$watch('columns', function () {
      if (!$scope.columns) return;
      var columns = $scope.columns.filter(function (column) {
        return column.visible;
      });
      grid.setColumns(columns);
    }, true);

    $scope.groupby = groupby;
    $scope.groupDefinitions = groupDefinitions;
  }
]);
