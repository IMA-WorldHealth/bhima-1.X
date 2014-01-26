angular.module('kpk.controllers').controller('journal', function ($scope, $translate, $compile, $timeout, $filter, $q, $http, $location, $modal, connect, validate, printer, messenger) {
  var dependencies = {}, ammendTransaction = $scope.ammendTransaction = {state: false};
  var grid, dataview, sort_column, columns, options;

  dependencies.journal = { 
    required: true,
    query: {
      'tables' : {
        'posting_journal' : { 'columns' : ["id", "trans_id", "trans_date", "doc_num", "description", "account_id", "debit", "credit", "currency_id", "deb_cred_id", "deb_cred_type", "inv_po_id", "debit_equiv", "credit_equiv", "currency_id"] },
        'account' : { 'columns' : ["account_number"] }
      },
      join: ["posting_journal.account_id=account.id"]
    } 
  }

  dependencies.account = {
    query : { 
      'tables' : { 
        'account' : { 'columns' : ['id', 'account_number', 'account_type_id', 'account_txt'] }
      }
    }
  }

  validate.process(dependencies).then(journal);
  
  function journal(model) { 
    $scope.model = model;
  
    defineGridOptions();
    initialiseGrid(); 
  }

  function defineGridOptions() { 
    sort_column = "trans_id";
    columns = [
      {id: 'trans_id', name: "Transaction #", field: 'trans_id', sortable: true},
      {id: 'trans_date', name: 'Date', field: 'trans_date', formatter: formatDate},
      // {id: 'doc_num', name: 'Doc No.', field: 'doc_num', maxWidth: 75},
      {id: 'description', name: 'Description', field: 'description', width: 110, editor:Slick.Editors.Text },
      {id: 'account_id', name: 'Account ID', field: 'account_number', sortable: true, editor:SelectCellEditor},
      // {id: 'debit', name: 'Debit', field: 'debit', groupTotalsFormatter: totalFormat, sortable: true, maxWidth:100},
      // {id: 'credit', name: 'Credit', field: 'credit', groupTotalsFormatter: totalFormat, sortable: true, maxWidth: 100},
      {id: 'debit_equiv', name: 'Debit Equiv', field: 'debit_equiv', groupTotalsFormatter: totalFormat, sortable: true, maxWidth:100, editor:Slick.Editors.Text},
      {id: 'credit_equiv', name: 'Credit Equiv', field: 'credit_equiv', groupTotalsFormatter: totalFormat, sortable: true, maxWidth: 100, editor:Slick.Editors.Text},
      {id: 'deb_cred_id', name: 'AR/AP Account', field: 'deb_cred_id'},
      {id: 'deb_cred_type', name: 'AR/AP Type', field: 'deb_cred_type'},
      {id: 'inv_po_id', name: 'Inv/PO #', field: 'inv_po_id'}
      // {id: 'currency_id', name: 'Currency ID', field: 'currency_id', width: 10 } 
    ];
    options = {
      enableCellNavigation: true,
      enableColumnReorder: true,
      forceFitColumns: true,
      editable: true,
      rowHeight: 30,
      autoEdit: false
    };
  }

  function initialiseGrid() { 
    var groupItemMetadataProvider = new Slick.Data.GroupItemMetadataProvider(); 
    dataview = new Slick.Data.DataView({
      groupItemMetadataProvider: groupItemMetadataProvider,
      inlineFilter: true

    });

    var chkbx = new Slick.CheckboxSelectColumn({
      cssClass: "slick-cell-checkboxsel"
    });

    columns.push(chkbx.getColumnDefinition());

    grid = new Slick.Grid('#journal_grid', dataview, columns, options);
    
    grid.registerPlugin(groupItemMetadataProvider);
    grid.setSelectionModel(new Slick.RowSelectionModel({selectActiveRow: false}));
    grid.registerPlugin(chkbx);
  
    // grid.setSelectionModel(new Slick.CellSelectionModel());

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

    grid.onSelectedRowsChanged.subscribe(function (e, args) {
      $scope.$apply(function () {
        $scope.rows = args.rows;
      });
    });

    grid.onBeforeEditCell.subscribe(function(e, row) { 
      if(ammendTransaction.state) return (row.item.trans_id === ammendTransaction.transaction_id);
      return false;
    });

    grid.onCellChange.subscribe(function(e, args) { 
      dataview.updateItem(args.item.id, args.item);
    });

    grid.onClick.subscribe(function(e, args) { 
      //FIXME REALLY hacky, redo button clicks 
      handleClick(e.target.className);
    });

    dataview.beginUpdate();
    dataview.setItems($scope.model.journal.data);
    dataview.endUpdate();

    // allow the user to select only certain columns shown
    $scope.columns = angular.copy(columns).map(function (column) {
      column.visible = true;
      return column;
    });
  }
  
  $scope.$watch('columns', function () {
    if (!$scope.columns) return;
    var columns = $scope.columns.filter(function (column) {
      return column.visible;
    });
    grid.setColumns(columns);
  }, true);

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
      aggregateCollapsed: true
    });
  };
    

  function formatTransactionGroup(g) { 
    var rowMarkup, firstElement = g.rows[0]; 
    if(ammendTransaction.state) { 
      if(firstElement.trans_id === ammendTransaction.transaction_id) {
        //markup for editing
        rowMarkup = "<span style='color: red;'><span style='color: red' class='glyphicon glyphicon-pencil'> </span> LIVE TRANSACTION " + g.value + " (" + g.count + " transactions)</span><div class='pull-right'><a class='addLine'><span class='glyphicon glyphicon-plus'></span> Add Line</a><a style='margin-left: 15px;'><span class='glyphicon glyphicon-floppy-save'></span> Submit Transaction</a></div>"  
        return rowMarkup;
      }
    }
    rowMarkup = "<span style='font-weight: bold'>" + g.value + "</span> (" + g.count + " transactions)</span>";
    return rowMarkup; 
  }



  function groupByAccount() {
    dataview.setGrouping({
      getter: "account_id",
      formatter: function(g) {
        return "<span style='font-weight: bold'>" + ( $scope.model.account ? $scope.model.account.get(g.value).account_txt : g.value) + "</span>";
      },
      aggregators: [
        new Slick.Data.Aggregators.Sum("debit"),
        new Slick.Data.Aggregators.Sum("credit"),
        new Slick.Data.Aggregators.Sum("debit_equiv"),
        new Slick.Data.Aggregators.Sum("credit_equiv")
      ],
      aggregateCollapsed: false
    });
  };

  $scope.removeGroup = function removeGroup() {
    dataview.setGrouping({});
  };

  function getRowData (row_array) {
    return row_array.map(function (id) {
      return grid.getDataItem(id);
    });
  }

  function getTxnIds(data) {
    var txn_ids = data.map(function (item) {
      return item.trans_id;
    });
    return txn_ids.filter(function (v, i) { return txn_ids.indexOf(v) === i; });
  }

  $scope.trial = function () {

    // first, we need to validate that all items in each trans have been
    // selected.

    if (!$scope.rows || !$scope.rows.length) return messenger.danger('No rows selected!');
    
    var selected = getRowData($scope.rows);
    var transaction_ids = getTxnIds(selected);

    messenger.warning('Posting data from transactions (' + transaction_ids.toString() + ')');

    connect.fetch('/trial/?q=(' + transaction_ids.toString() + ')')
    .then(function (data) {
      messenger.success('Trial balance run!');
      var instance = $modal.open({
        templateUrl:'trialBalanceModal.html',
        controller: 'trialBalance',
        resolve : {
          request: function () {
            return data.data;
          },
          ids : function () {
            return transaction_ids;
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

  // function formatBtn() {
  //   return "<a class='ng-scope' ng-click='splitTransaction()'><span class='glyphicon glyphicon-th-list'></span></a>";
  // }

  function totalFormat(totals, column) {

    var format = {};
    format['Credit'] = '#F70303';
    format['Debit'] = '#02BD02';
    format['Debit Equiv'] = '#F70303';
    format['Credit Equiv'] = '#02BD02';
    
    var val = totals.sum && totals.sum[column.field];
    if (val !== null) {
      return "<span style='font-weight: bold; color:" + format[column.name] + "'>" + $filter('currency')((Math.round(parseFloat(val)*100)/100)) + "</span>";
    }
    return "";
  }

      
  function groupBy(targetGroup) { 
    var groupMap = {
      'transaction' : groupByTransaction,
      'account' : groupByAccount
    };

    if(groupMap[targetGroup]) groupMap[targetGroup]();
  }

  function handleClick(className) { 
    var buttonMap = { 
      'addLine': newLine
    }
    if(buttonMap[className]) buttonMap[className]();
  }

  function addTransaction(template) { 
    var balanceTransaction, temporaryId = $scope.model.journal.generateid();
    var initialTransaction = {
      id: temporaryId,
      trans_id: template.id,
      trans_date: template.date, 
      description: template.description,
      debit_equiv: 0,
      credit_equiv: 0,
      account_number: "(Select Account)"
    }
    
    //Duplicates object - not very intelectual
    balanceTransaction = JSON.parse(JSON.stringify(initialTransaction));
    balanceTransaction.id = ++balanceTransaction.id; 
    
    groupBy('transaction');
    ammendTransaction.transaction_id = template.id;
    ammendTransaction.state = true;
    ammendTransaction.template = template;
    
    console.log('id', balanceTransaction.id, 'and', initialTransaction.id);
    dataview.addItem(initialTransaction);
    dataview.addItem(balanceTransaction);
    grid.scrollRowToTop(dataview.getRowById(initialTransaction.id));
  }

  function newLine() { 

    $scope.model.journal.recalculateIndex();
    var temporaryId = $scope.model.journal.generateid();
    var template = ammendTransaction.template;
    var transactionLine = {
      id: temporaryId,
      trans_id: template.id,
      trans_date: template.date, 
      description: template.description,
      debit_equiv: 0,
      credit_equiv: 0
    }
    
    // $scope.model.journal.put(transactionLine);
    dataview.addItem(transactionLine);
    grid.scrollRowToTop(dataview.getRowById(transactionLine.id));
  }

  $scope.groupBy = groupBy;
  $scope.openTransaction = openTransaction;
  
  //FIXME: without a delay of (roughly)>100ms slickgrid throws an error saying CSS can't be found
  //$timeout(init, 100);
 
  function openTransaction() { 
    if(!ammendTransaction.state) { 
      var verifyTransaction = $modal.open({ 
        templateUrl: "verifyTransaction.html",
        controller: 'verifyTransaction',
        resolve : { 
        }
      });

      verifyTransaction.result.then(function(res) { 
        addTransaction(res);
      }, function(err) { console.log('err', err) });
    }
  }
  
  //TODO iterate thorugh columns array - apply translate to each heading and update
  //(each should go through translate initially as well)
  $scope.$on('$translateChangeSuccess', function () {
    //grid.updateColumnHeader("trans_id", $translate('GENERAL_LEDGER'));
  });

  $scope.split = function split() {
    var instance = $modal.open({
      templateUrl: "split.html",
      controller: function ($scope, $modalInstance, rows, data) { //groupStore, accountModel
        var transaction = $scope.transaction = data.getItem(rows[0]);
        console.log('split', transaction);
      },
      resolve: {
        rows: function () { return $scope.rows; },
        data: function () { return dataview; }
      }
    });
  };

  $scope.thislist = [{val: 'first name'}, {val: 'first name'}, {val: 'first name'},{val: 'first name'},{val: 'first name'}, {val: 'second name'}, {val: 'first name'}, {val: 'first name'}, {val: 'first name'},{val: 'first name'},{val: 'first name'}, {val: 'second name'}, {val: 'first name'}, {val: 'first name'}, {val: 'first name'},{val: 'first name'},{val: 'first name'}, {val: 'second name'}];
    
  function SelectCellEditor(args) { 
    var $select;
    var defaultValue;
    var scope = this;

    var id = args.column.id;
    var targetObejct = args.item;

    this.init = function() {
      
      //default value - naive way of checking for previous value, default string is set, not value
      defaultValue = isNaN(Number(args.item.account_number)) ? null : args.item.account_number;
      option_str = ""
      $scope.model.account.data.forEach(function(account) { 
        var disabled = (account.account_type_id === 3) ? 'disabled' : '';
        option_str += '<option ' + disabled + ' value="' + account.account_number + '">' + account.account_number + ' ' + account.account_txt + '</option>';
        if(!defaultValue && account.account_type_id!==3) { 
          defaultValue = account.account_number;
        }

      });
              
      $select = $("<SELECT class='editor-text'>" + option_str + "</SELECT>");
      // $select = $compile("<span><input type='text' ng-model='account_id' typeahead='thing as thing.val for thing in thislist | filter: $viewValue' class='editor-typeahead' placeholder='Account Id'></span>")($scope);
      $select.appendTo(args.container);
      $select.focus();
    };

    this.destroy = function() {
      $select.remove();
    };

    this.focus = function() {
      $select.focus();
    };

    this.loadValue = function(item) {
      // defaultValue = item[args.column.field];
      console.log(defaultValue);
      $select.val(defaultValue);
    };

    this.serializeValue = function() {
      return $select.val();
    };

    this.applyValue = function(item,state) {
      console.log('applying value', item, state);
      item[args.column.field] = state;
    };

    this.isValueChanged = function() {
      console.log('select.val', $select.val());
        return ($select.val() != defaultValue);
    };

    this.validate = function() {
        return {
            valid: true,
            msg: null
        };
    };

    this.init();
  }
});
