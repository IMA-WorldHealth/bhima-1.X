angular.module('bhima.services')
.service('JournalGridService', ['JournalDataviewService', 'JournalColumnsService', 'JournalManagerService', 'uuid', 
  function (dataviewService, columnsService, managerService, uuid) {

    this.grid = null;
    this.dataviewService = dataviewService;
    this.columnsService = columnsService;
    this.managerService = managerService;
    this.idDom = '#journal_grid';
    this.sortColumn = null;
    this.options = {
        enableCellNavigation: true,
        enableColumnReorder: true,
        forceFitColumns: true,
        editable: true,
        rowHeight: 30,
        autoEdit: false
    };

    this.buildGrid = function buildGrid (){
      this.grid = new Slick.Grid(this.idDom, this.dataviewService.dataview, this.columnsService.getColumns(), this.options);
      this.grid.setSelectionModel(new Slick.RowSelectionModel({selectActiveRow: false}));
      this.grid.registerPlugin(this.dataviewService.gimp);
      return this.grid;
    };

    this.subscribeToOnCellChange = function subscribeToOnCellChange (){
      if(!this.dataviewService.dataview) {throw 'undefined dataview';}
      if(!this.grid) {throw 'undefined grid, call buildGrid method first!';}

      this.grid.onCellChange.subscribe(function(e, args) {
        var id = args.item.id || args.item.uuid;
        this.dataviewService.dataview.updateItem(id, args.item);
      });
    }; 

    this.subscribeToOnSort = function subscribeToOnSort (){
      if(!this.dataviewService.dataview) {throw 'undefined dataview';}
      if(!this.grid) {throw 'undefined grid, call buildGrid method first!';}

      this.grid.onSort.subscribe(function (e, args) {
        this.sortColumn = args.sortCol.field;
        this.dataviewService.dataview.sort(sort, args.sortAsc);
      });
    };

    // this.subscribeToOnclick = function subscribeToOnclick (){
    //   if(!this.grid) {throw 'undefined grid, call buildGrid method first!'}
    //   this.grid.onClick.subscribe(function (e, args) {
    //     handleClick(e.target.className, args);
    //   });
    // }

    function handleClick(className, args) {
      var classes = className.split(' ');
      var buttonMap = {
        'addRow'            : addRow
        // ,
        // 'deleteRow'         : deleteRow,
        // 'editTransaction'   : editTransaction,
        // 'saveTransaction'   : saveTransaction,
        // 'deleteTransaction' : deleteTransaction
      };
      classes.forEach(function (cls) {
        if (buttonMap[cls]) { buttonMap[cls](args); }
      });
    }

    // function editTransaction(args) {

    //   var transaction = this.dataviewService.getItem(args.row),
    //   transactionId = transaction.groupingKey,
    //   templateRow = transaction.rows[0];
    //   this.managerService.setRowId(args.row);
    //   this.managerService.setMode('edit');
    //   this.managerService.setTransactionId(transaction.groupingKey);

    //   if (!transactionId) { 
    //     throw 'Inalid Transaction'; //return $rootScope.$apply(messenger.danger('Invalid transaction provided')); 
    //   }

    //   manager.fn.showDeleteButton();

    //   manager.origin = {
    //     'debit'        : transaction.totals.sum.debit,
    //     'credit'       : transaction.totals.sum.credit,
    //     'debit_equiv'  : transaction.totals.sum.debit_equiv,
    //     'credit_equiv' : transaction.totals.sum.credit_equiv
    //   };

    //   manager.session.records = new Store({ data : [], identifier: 'uuid'});
    //   manager.session.removed = new Store({ data : [], identifier: 'uuid'});

    //   manager.session.template = {
    //     trans_id       : transactionId,
    //     fiscal_year_id : templateRow.fiscal_year_id,
    //     period_id      : templateRow.period_id,
    //     trans_date     : templateRow.trans_date,
    //     description    : templateRow.description,
    //     project_id     : templateRow.project_id,
    //     account_number : '(Select Account)',
    //     debit_equiv    : 0,
    //     credit_equiv   : 0,
    //     debit          : 0,
    //     credit         : 0,
    //     inv_po_id      : templateRow.inv_po_id,
    //     currency_id    : templateRow.currency_id,
    //     userId         : 13 // FIXME
    //   };

    //   transaction.rows.forEach(function (row) {
    //     row.newRecord = false;
    //     manager.session.records.post(row);
    //   });

    //   grid.invalidate();
    //   manager.fn.regroup();
    //   $rootScope.$apply(messenger.success('Transaction #' + transactionId));
    // }

    function addRow () {
      var row;
      row = doParsing(this.managerService.manager.session.template);
      row.newRecord = true;
      row.uuid = uuid();
      this.managerService.postItem(row); 
      this.dataviewService.addNewItem(row);
    }

    // function deleteRow (args) {
    //   var item = dataviewService.getItem(args.row);
    //   if (manager.session.records.data.length < 2) { return broadcastError('Cannot delete last line in transaction.'); }
    //   // post to removed list and removed from records
    //   manager.session.removed.post(item);
    //   manager.session.records.remove(item.uuid);
    //   dataview.deleteItem(item.uuid);
    //   grid.invalidateRow(args.row);
    //   grid.render();
    // }

    function sort (a,b) {
      var x = a[this.sortColumn];
      var y = b[this.sortColumn];
      return x > y ? 1 : -1;
    }

    function doParsing (o) { return JSON.parse(JSON.stringify(o)); }

    this.applyColumns = function applyColumns(){
      this.grid.setColumns(this.columns);
    };
  }
]);