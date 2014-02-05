angular.module('kpk.controllers').controller('reportGeneralLedgerCtrl', function ($scope, $q, $filter, connect, appstate, validate) {
  'use strict'; 
  var dependencies = {}, flags = $scope.flags = {};
  var columns, dataview, options, grid;

  dependencies.ledger = { 
    query : {
      tables : { 
        'general_ledger' : { columns : ['id', 'fiscal_year_id', 'period_id', 'trans_id', 'trans_date', 'doc_num', 'description', 'account_id', 'debit', 'credit', 'debit_equiv', 'credit_equiv', 'currency_id', 'deb_cred_id', 'deb_cred_type', 'inv_po_id', 'comment', 'cost_ctrl_id', 'origin_id', 'user_id']},
        'account' : { columns : ['account_number']}
      },
      join : ['general_ledger.account_id=account.id'],
    }
  };
  
  appstate.register('enterprise', buildLedgerQuery);

  function buildLedgerQuery(enterprise) { 
    dependencies.ledger.where = ['general_ledger.enterprise_id='+enterprise.id]
    validate.process(dependencies).then(reportGeneralLedger);
  }

  function reportGeneralLedger(model) { 
    $scope.model = model;
    
    settupGridOptions();
    initialiseGrid();
  }

  function settupGridOptions() { 
    columns = [
      {id: 'id'             , name: 'ID'                  , field:'id'             , visible : false} ,
      {id: 'fiscal_year_id' , name: 'Fiscal Year'         , field:'fiscal_year_id' , visible : true } ,
      {id: 'period_id'      , name: 'Period'              , field:'period_id'      , visible : true } ,
      {id: 'trans_id'       , name: 'Transaction ID'      , field:'trans_id'       , visible : true } ,
      {id: 'trans_date'     , name: 'Date'                , field:'trans_date'     , visible : true, formatter: formatDate},
      {id: 'doc_num'        , name: 'Document ID'         , field:'doc_num'        , visible : true } ,
      {id: 'description'    , name: 'Description'         , field:'description'    , visible : true } ,
      {id: 'account_number' , name: 'Account'             , field:'account_number' , visible : true } ,
      {id: 'debit'          , name: 'Debit'               , field:'debit'          , visible : false, formatter: formatAmount},
      {id: 'credit'         , name: 'Credit'              , field:'credit'         , visible : false, formatter: formatAmount},
      {id: 'debit_equiv'    , name: 'Debit Equiv.'        , field:'debit_equiv'    , visible : true, formatter: formatEquiv},
      {id: 'credit_equiv'   , name: 'Credit Equiv.'       , field:'credit_equiv'   , visible : true, formatter: formatEquiv},
      {id: 'currency_id'    , name: 'Currency'            , field:'currency_id'    , visible : false} ,
      {id: 'deb_cred_id'    , name: 'Deb/Cred ID'         , field:'deb_cred_id'    , visible : true } ,
      {id: 'deb_cred_type'  , name: 'D/C'                 , field:'deb_cred_type'  , visible : true } ,
      {id: 'inv_po_id'      , name: 'Invoice/Purchase ID' , field:'inv_po_id'      , visible : true } ,
      {id: 'comment'        , name: 'Comment'             , field:'comment'        , visible : false} ,
      {id: 'origin_id'      , name: 'Origin ID'           , field:'origin_id'      , visible : false} ,
      {id: 'user_id'        , name: 'User ID'             , field:'user_id'        , visible : false}
    ];
    $scope.columns = angular.copy(columns);

    options = {
      enableCellNavigation: true,
      enableColumnReorder: true,
      forceFitColumns: true,
      rowHeight: 35,
    };
  }

  function initialiseGrid() { 
    dataview = new Slick.Data.DataView();

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

    //Grid sorting 
    grid.onSort.subscribe(function(e, args) {
      sort_column = args.sortCol.field;
      dataview.sort(compareSort, args.sortAsc);
    });

    dataview.beginUpdate();
    dataview.setItems($scope.model.ledger.data);
    dataview.setFilterArgs({
      searchStr: flags.searchStr
    });
    dataview.setFilter(search);
    dataview.endUpdate();

    dataview.syncGridSelection(grid, true);
  }

  //Grid sort methods
  function compareSort(a, b) {
    var x = a[sort_column], y = b[sort_column];
    return (x == y) ? 0 : (x > y ? 1 : -1);
  }

  function search (item, args) {
    if (item.searchStr !== "" &&
        String(item.account_number).indexOf(args.searchStr) === -1 &&
        String(item.trans_id).indexOf(args.searchStr) === -1 &&
        String(item.deb_cred_id).indexOf(args.searchStr) === -1
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
  $scope.$watch('flags.searchStr', function () {
    if (!flags.searchStr) flags.searchStr = ""; //prevent default
    dataview.setFilterArgs({
      searchStr: flags.searchStr 
    });
    dataview.refresh();
  });

  $scope.$watch('columns', function () {
    if (!$scope.columns) return;
    var columns = $scope.columns.filter(function (column) {
      return column.visible;
    });
    grid.setColumns(columns);
  }, true);

});
