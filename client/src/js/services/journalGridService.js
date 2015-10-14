angular.module('bhima.services')
.service('JournalGridService', ['JournalDataviewService', 'JournalColumnsService', 'JournalManagerService', 'uuid', 'SessionService', 'messenger',  
  function (dataviewService, columnsService, managerService, uuid, sessionService, messenger) {
    var gridService = this;
    gridService.grid = null;
    gridService.dataviewService = dataviewService;
    gridService.columnsService = columnsService;
    gridService.managerService = managerService;
    gridService.idDom = '#journal_grid';
    gridService.sortColumn = null;
    gridService.options = {
        enableCellNavigation: true,
        enableColumnReorder: true,
        forceFitColumns: true,
        editable: true,
        rowHeight: 30,
        autoEdit: false
    };

    gridService.buildGrid = function buildGrid (){
      gridService.grid = new Slick.Grid(gridService.idDom, gridService.dataviewService.dataview, gridService.columnsService.columns, gridService.options);
      gridService.grid.setSelectionModel(new Slick.RowSelectionModel({selectActiveRow: false}));
      gridService.grid.registerPlugin(gridService.dataviewService.gimp);
      return gridService.grid;
    };

    gridService.subscribeToOnCellChange = function subscribeToOnCellChange (){
      if(!gridService.dataviewService.dataview) {throw 'undefined dataview';}
      if(!gridService.grid) {throw 'undefined grid, call buildGrid method first!';}

      gridService.grid.onCellChange.subscribe(function(e, args) {
        var id = args.item.id || args.item.uuid;
        gridService.dataviewService.dataview.updateItem(id, args.item);
      });
    }; 

    gridService.subscribeToOnSort = function subscribeToOnSort (){
      if(!gridService.dataviewService.dataview) {throw 'undefined dataview';}
      if(!gridService.grid) {throw 'undefined grid, call buildGrid method first!';}

      gridService.grid.onSort.subscribe(function (e, args) {
        gridService.sortColumn = args.sortCol.field;
        gridService.dataviewService.dataview.sort(sort, args.sortAsc);
      });
    };

    gridService.subscribeToOnBeforeEditCell = function subscribeToOnBeforeEditCell (){
      gridService.grid.onBeforeEditCell.subscribe(function (e, args) {
        var item =  gridService.dataviewService.dataview.getItem(args.row);
        if (gridService.managerService.getMode() !== 'edit' || gridService.managerService.getSessionTransactionId() !== item.trans_id ) { return false; }
      });
    };     

    gridService.subscribeToOnclick = function subscribeToOnclick (){
      if(!gridService.grid) {throw 'undefined grid, call buildGrid method first!';}
      gridService.grid.onClick.subscribe(function (e, args) {
        handleClick(e.target.className, args);
      });
    };

    function handleClick(className, args) {
      var classes = className.split(' ');
      var buttonMap = {
        'editTransaction'   : editTransaction,
        'deleteRow'         : deleteRow,
        'addRow'            : addRow
        // ,
        // ,
        // ,
        // 'saveTransaction'   : saveTransaction,
        // 'deleteTransaction' : deleteTransaction
      };
      classes.forEach(function (cls) {
        if (buttonMap[cls]) { buttonMap[cls](args); }
      });
    }

    function editTransaction(args) {
      var transaction = gridService.dataviewService.getItem(args.row),
      transactionId = transaction.groupingKey,
      templateRow = transaction.rows[0];
      gridService.managerService.setRowId(args.row);
      gridService.managerService.setMode('edit');
      gridService.managerService.setSessionTransactionId(transaction.groupingKey);

      if (!transactionId) { 
        throw 'Inalid Transaction'; //return $rootScope.$apply(messenger.danger('Invalid transaction provided')); 
      }

      var template = {
        trans_id       : transactionId,
        fiscal_year_id : templateRow.fiscal_year_id,
        period_id      : templateRow.period_id,
        trans_date     : templateRow.trans_date,
        description    : templateRow.description,
        project_id     : templateRow.project_id,
        account_number : '(Select Account)',
        debit_equiv    : 0,
        credit_equiv   : 0,
        debit          : 0,
        credit         : 0,
        inv_po_id      : templateRow.inv_po_id,
        currency_id    : templateRow.currency_id,
        userId         : sessionService.user.id
      };

      gridService.managerService.showDeleteButton(gridService.grid);
      gridService.managerService.setSessionTemplate(template);


      // manager.origin = {
      //   'debit'        : transaction.totals.sum.debit,
      //   'credit'       : transaction.totals.sum.credit,
      //   'debit_equiv'  : transaction.totals.sum.debit_equiv,
      //   'credit_equiv' : transaction.totals.sum.credit_equiv
      // };

      transaction.rows.forEach(function (row) {
        row.newRecord = false;
        gridService.managerService.postRecord(row);
      });

      gridService.grid.invalidate();

      if (gridService.dataviewService.getGrouping()) {
        gridService.dataviewService.groupBy(gridService.dataviewService.getGrouping()); 
      }
      messenger.success('Transaction #' + transactionId);
    }

    function addRow () {
      var row;
      row = doParsing(gridService.managerService.getSessionTemplate());
      row.newRecord = true;
      row.uuid = uuid();
      gridService.managerService.postItem(row); 
      gridService.dataviewService.addNewItem(row);
    }

    function deleteRow (args) {
      var item = gridService.dataviewService.getItem(args.row);
      if (gridService.managerService.getRecordLength() < 2) { throw 'Cannot delete last line in transaction.'; }
      // post to removed list and removed from records
      gridService.managerService.postRemovable(item);
      gridService.managerService.removeRecord(item.uuid);      
      gridService.dataviewService.deleteItem(item.uuid);
      gridService.grid.invalidateRow(args.row);
      gridService.grid.render();
    }

    function sort (a,b) {
      var x = a[this.sortColumn];
      var y = b[this.sortColumn];
      return x > y ? 1 : -1;
    }

    function doParsing (o) { return JSON.parse(JSON.stringify(o)); }

    gridService.applyColumns = function applyColumns(cols){
      gridService.grid.setColumns(cols || gridService.columnsService.columns);
    };
  }
]);