angular.module('bhima.services')
.service('JournalGridService', ['JournalDataviewService', 'JournalColumnsService', 'JournalManagerService', 'uuid', 'SessionService', 'messenger', 'JournalValidationService', 'liberror', 'JournalDataLoaderService', 'util', 'connect', '$q', '$translate', 'precision', '$window', 
  function (dataviewService, columnsService, managerService, uuid, sessionService, messenger, validationService, liberror, dataLoaderService, util, connect, $q, $translate, precision, $window) {
    var gridService = this,
        journalError =  liberror.namespace('JOURNAL');
    gridService.grid = null;
    gridService.dataviewService = dataviewService;
    gridService.columnsService = columnsService;
    gridService.managerService = managerService;
    gridService.dataLoaderService = dataLoaderService;
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
        'addRow'            : addRow,
        'saveTransaction'   : saveTransaction
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
      gridService.managerService.postRecord(row); 
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

    function isNull (t) { return t === null; }

    function deleteTransaction (args) {
      var bool = $window.confirm('Are you sure you want to delete this transaction?');
      if (!bool) { return; }
      var item = gridService.dataviewService.dataview.getItem(args.row);
      item.rows.forEach(function (row) {
        gridService.managerService.postRemovable(row);
        gridService.managerService.removeRecord(row.uuid);
        gridService.dataviewService.deleteItem(row.uuid);
      });
      gridService.grid.invalidate();
      saveTransaction();
    } 

    function saveTransaction () {
      var records = gridService.managerService.getRecordData(),
          removed = gridService.managerService.getRemovedData();

      var hasErrors = checkErrors(records);
      if (hasErrors) { return; }

        var newRecords = [],
            editedRecords = [],
            removedRecords = [];

        records.forEach(function (record) {
          var newRecord = record.newRecord,
              packed = packager(record);
          (newRecord ? newRecords : editedRecords).push(packed);
        });

        removed.forEach(function (record) {
          if (record.newRecord) { return; }
          removedRecords.push(record.uuid);
        });

        gridService.managerService.setSessionUserId(sessionService.user.id);
        newRecords.forEach(function (rec) { rec.user_id = sessionService.user.id; });
        editedRecords.forEach(function (rec) { rec.user_id = sessionService.user.id; });
        var promesse = newRecords.length ? connect.post('posting_journal', newRecords) : $q.when(1);

        promesse
        .then(function () {
          return editedRecords.length ? editedRecords.map(function (record) { return connect.put('posting_journal', [record], ['uuid']); }) : $q.when(1);
        })
        .then(function () {
          return removedRecords.length ? connect.delete('posting_journal', 'uuid', removedRecords) : $q.when(1);
        })
        .then(function () {
          return writeJournalLog(managerService.getSession());
        })
        .then(function () {
          messenger.success($translate.instant('POSTING_JOURNAL.TRANSACTION_SUCCESS')); 
          managerService.resetManagerSession();
          if (gridService.dataviewService.getGrouping()) {
           gridService.dataviewService.groupBy(gridService.dataviewService.getGrouping()); 
          }
          gridService.grid.invalidate();
        })
        .catch(function (err) {
          messenger.danger('Submission failed' + err);
        })
        .finally();
    }

    function writeJournalLog (session) {
      var packagedLog = {
        uuid           : session.uuid,
        transaction_id : session.transactionId,
        justification  : session.justification,
        date           : util.convertToMysqlDate(session.start),
        user_id        : session.userId
      };

      return connect.post('journal_log', [packagedLog]);
    }

    function checkErrors (records) {
      if (!records.length) { return; }
      var totalDebits = 0, totalCredits = 0;

      var dateError = false,
          accountError = false,
          balanceError = false,
          singleEntryError = false,
          multipleDatesError = false,
          periodError = false,
          fiscalError = false;

      //validation
      records.forEach(function (record) {
        totalDebits += precision.round(Number(record.debit_equiv));
        totalCredits += precision.round(Number(record.credit_equiv));
        if (!validationService.isDateValid(record)) { dateError = true; }
        if (!validationService.isAccountNumberValid(record)) { accountError = true; }
        if (!validationService.isBalanceValid(record)) { balanceError = true; }
        if (!validationService.isDebitsAndCreditsValid(record)) { balanceError = true; }
        if (validationService.detectSingleEntry(record)) { singleEntryError = true; }
        if (!validationService.isPeriodValid(record)) { periodError = true; }
        if (!validationService.isValidFiscal(record)) { fiscalError = true; }
      });

      var testDate = new Date(records[0].trans_date).setHours(0,0,0,0);
      multipleDatesError = records.some(function (record) {
        return new Date(record.trans_date).setHours(0,0,0,0) !== testDate;
      });

      totalDebits = precision.round(totalDebits);
      totalCredits = precision.round(totalCredits);

      //TO DO : some error message must be translate

      if (singleEntryError) { journalError.throw('ERR_TXN_SINGLE_ENTRY'); }
      if (!validationService.isTotalsValid(totalDebits, totalCredits)) { journalError.throw('ERR_TXN_IMBALANCE'); }
      if (accountError) { broadcastError('Records contain invalid or nonexistant accounts.'); }
      if (dateError) { broadcastError('Transaction contains invalid dates.'); }
      if (multipleDatesError) { broadcastError('Transaction trans_date field has multiple dates.'); }
      if (periodError) { broadcastError('Transaction date does not fall in any valid periods.'); }
      if (fiscalError) { broadcastError('Transaction date does not fall in any valid fiscal years.'); }

      var hasErrors = (
          dateError || accountError ||
          balanceError || singleEntryError ||
          multipleDatesError || fiscalError ||
          periodError || !validationService.isTotalsValid(totalDebits, totalCredits)
      );

      return hasErrors;
    }

    function packager(record) {
      var data = {}, cpProperties, prop;

      cpProperties = [
        'uuid', 'project_id', 'trans_id', 'trans_date', 'period_id', 'description', 'account_id',
        'credit', 'debit', 'debit_equiv', 'credit_equiv', 'fiscal_year_id', 'currency_id',
        'deb_cred_id', 'deb_cred_type', 'inv_po_id', 'user_id', 'origin_id', 'cc_id', 'pc_id'
      ];

      for (prop in record) {
        if (cpProperties.indexOf(prop) > -1) {
          if (angular.isDefined(record[prop]) && !isNull(record[prop])) {
            data[prop] = record[prop];
          }
        }
      }

      // FIXME : This will no longer work if we have non-unique account
      // numbers.
      if (record.account_number) { data.account_id = gridService.dataLoaderService.account.get(record.account_number).id; }

      // Transfer values from cc over to posting journal cc_id and pc_id fields
      // This is because we are doing a join, similar to the account_number field
      // above.
      // We check for NaNs because we don't have unique identifers like the account number
      // for an account.
      if (record.cc && !Number.isNaN(Number(record.cc))) { data.cc_id = record.cc; }
      if (record.pc && !Number.isNaN(Number(record.pc))) { data.pc_id = record.pc; }

      // FIXME : Hack to get deletion to work with parser.js
      // This is probably pretty damn insecure
      if (record.cc === 'null') { data.cc_id = null; }
      if (record.pc === 'null') { data.pc_id = null; }

      // FIXME : Review this decision
      data.project_id = sessionService.project.id;
      data.origin_id = 4;
      return data;
    }

    function sort (a,b) {
      var x = a[this.sortColumn];
      var y = b[this.sortColumn];
      return x > y ? 1 : -1;
    }

    function doParsing (o) { return JSON.parse(JSON.stringify(o)); }

    function broadcastError (desc) {
      journalError.throw(desc);
    }

    gridService.applyColumns = function applyColumns(cols){
      gridService.grid.setColumns(cols || gridService.columnsService.columns);
    };
  }
]);