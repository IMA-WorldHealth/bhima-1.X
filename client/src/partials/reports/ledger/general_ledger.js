angular.module('bhima.controllers')
.controller('reportGeneralLedger', [
  '$scope',
  '$translate',
  '$filter',
  'appstate',
  'validate',
  'GeneralLedgerService',
  'GridHelperFactory',
  function ($scope, $translate, $filter, appstate, validate, GLService, GridHelper) {
    /* jshint unused : false */

    // used by SlickGrid
    var columns, dataview, options, grid;

    GLService.load()
    .then(function (store) {

      // bind data from server
      $scope.ledger = store;

      // start up SlickGrid
      setupGridOptions();
      initialiseGrid();
    })
    .catch(console.error)
    .finally();

    // expose the enterprise to the view
    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
    });

    // init grid
    function setupGridOptions() {

      // Grid formats
      function formatAmount(row, cell, value) {
        return $filter('currency')(value);
      }

      function formatEquiv(row, cell, value) {
        return $filter('currency')(value);
      }

      function formatDate (row, cell, value) {
        return $filter('date')(value);
      }

      function formatGroupTotalRow(totals, column) {
        var val = totals.sum && totals.sum[column.field];
        if (val !== null) {
          return '<span style=\'font-weight: bold\'>' + $filter('currency')(Math.round(parseFloat(val)*100/100)) + '</span>';
        }
        return '';
      }

      columns = [
        {id: 'uuid'           , name: $translate.instant('COLUMNS.ID')             , field:'uuid'           , visible : false} ,
        {id: 'fiscal_year_id' , name: $translate.instant('COLUMNS.FISCAL_YEAR_ID') , field:'fiscal_year_id' , visible : true } ,
        {id: 'period_id'      , name: $translate.instant('COLUMNS.PERIOD_ID')      , field:'period_id'      , visible : true } ,
        {id: 'trans_id'       , name: $translate.instant('COLUMNS.TRANS_ID')       , field:'trans_id'       , visible : true } ,
        {id: 'trans_date'     , name: $translate.instant('COLUMNS.DATE')           , field:'trans_date'     , visible : true   , formatter: formatDate}  ,
        {id: 'doc_num'        , name: $translate.instant('COLUMNS.DOCUMENT_ID')    , field:'doc_num'        , visible : true } ,
        {id: 'description'    , name: $translate.instant('COLUMNS.DESCRIPTION')    , field:'description'    , visible : true } ,
        {id: 'account_number' , name: $translate.instant('COLUMNS.ACCOUNT_NUMBER') , field:'account_number' , visible : true } ,
        {id: 'debit'          , name: $translate.instant('COLUMNS.DEBIT')          , field:'debit'          , visible : false  , formatter: formatAmount , groupTotalsFormatter: formatGroupTotalRow}  ,
        {id: 'credit'         , name: $translate.instant('COLUMNS.CREDIT')         , field:'credit'         , visible : false  , formatter: formatAmount , groupTotalsFormatter: formatGroupTotalRow}  ,
        {id: 'debit_equiv'    , name: $translate.instant('COLUMNS.DEB_EQUIV')      , field:'debit_equiv'    , visible : true   , formatter: formatEquiv  , groupTotalsFormatter: formatGroupTotalRow } ,
        {id: 'credit_equiv'   , name: $translate.instant('COLUMNS.CRE_EQUIV')      , field:'credit_equiv'   , visible : true   , formatter: formatEquiv  , groupTotalsFormatter: formatGroupTotalRow}  ,
        {id: 'currency_id'    , name: $translate.instant('COLUMNS.CURRENCY')       , field:'currency_id'    , visible : false} ,
        {id: 'deb_cred_uuid'  , name: $translate.instant('COLUMNS.DEBCRED_ID')     , field:'deb_cred_uuid'  , visible : true } ,
        {id: 'deb_cred_type'  , name: $translate.instant('COLUMNS.DC_TYPE')        , field:'deb_cred_type'  , visible : true } ,
        {id: 'inv_po_id'      , name: $translate.instant('COLUMNS.INVPO_ID')       , field:'inv_po_id'      , visible : true } ,
        {id: 'comment'        , name: $translate.instant('COLUMNS.COMMENT')        , field:'comment'        , visible : false} ,
        {id: 'origin_id'      , name: $translate.instant('COLUMNS.ORIGIN_ID')      , field:'origin_id'      , visible : false} ,
        {id: 'user_id'        , name: $translate.instant('COLUMNS.USER_ID')        , field:'user_id'        , visible : false}
      ];

      // TODO : make this into a directive
      $scope.columns = angular.copy(columns);

      options = {
        enableCellNavigation: true,
        enableColumnReorder: true,
        forceFitColumns: true,
        rowHeight: 35,
      };
    }

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

      grid = new Slick.Grid('#generalLedger', dataview, columns, options);
      grid.setSelectionModel(new Slick.RowSelectionModel());

      grid.registerPlugin(groupItemMetadataProvider);

      // set up sorting
      GridHelper.sorting.setupSorting(grid, dataview);

      dataview.beginUpdate();
      dataview.setItems($scope.ledger.data, 'uuid');
      dataview.endUpdate();

      dataview.syncGridSelection(grid, true);
    }


    // grouping
    function groupByTransaction() {
      GridHelper.grouping.byTransaction(dataview, false);
    }

    function groupByAccount() {
      GridHelper.grouping.byAccount(dataview, false);
    }

    function clearGrouping() {
      GridHelper.grouping.clear();
    }

    $scope.$watch('columns', function () {
      if (!$scope.columns) { return; }
      var columns = $scope.columns.filter(function (column) {
        return column.visible;
      });
      grid.setColumns(columns);
    }, true);

    $scope.groupByTransaction = groupByTransaction;
    $scope.groupbyAccount = groupByAccount;
    $scope.clearGrouping = clearGrouping;
  }
]);
