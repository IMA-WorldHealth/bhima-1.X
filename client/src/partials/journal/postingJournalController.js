var PostingJournalController = function ($translate, $filter, $q, precision, sessionService, dataviewService, columnsService, gridService, dataLoaderService, liberror, messenger, Store, connect, $window, uuid, $rootScope, util, managerService) {
  var vm = this;
  var journalError =  liberror.namespace('JOURNAL'); //declaring a variable to handle error  
  vm.managerService = managerService;
  vm.dataviewService = dataviewService;
  vm.columnsService  = columnsService;
  vm.dataLoaderService = dataLoaderService;
  vm.grid     = gridService.buildGrid();
  vm.editing = false;
  vm.project = sessionService.project;


  doSubscription();  //subscribe dataview and grid to event

  dataviewService.populate()
  .then(dataLoaderService.loadAdditionalData)  
  .then(initialise)
  .catch(handleErrors);

  function isNull (t) { return t === null; }
  
  function isDefined (d) { return angular.isDefined(d); }
  function handleErrors (error) {
    messenger.danger('An error occured ' + JSON.stringify(error));
  }

  function initialise (models) {
    angular.extend(vm, models);
    vm.journal = new Store({ data : this.dataviewService.dataview.getItems() });

    var editors = {
      'trans_date'    : DateEditor, // SlickGrids date editors uses $() datepicker
      'account_id'    : AccountEditor,
      'deb_cred_uuid' : DebCredEditor,
      'deb_cred_type' : DebCredTypeEditor,
      'inv_po_id'     : InvoiceEditor,
      'cc_id'         : CostCenterEditor,
      'pc_id'         : ProfitCenterEditor
    };

    columnsService.setEditor(editors);   
    gridService.applyColumns();      
  }

  function DateEditor(args) {
    var defaultValue;

    this.init = function () {
      defaultValue = args.item.trans_date.split('T')[0]; // If the date encodes timezone info, strip it.
      this.$input = $('<input class="editor-text" type="date">');
      this.$input.appendTo(args.container);
      this.$input.focus();
    };

    this.applyValue = function (item, state) {
      var dateInfo = getDateInfo(state);
      item.fiscal_year_id = dateInfo.fiscal_year_id;
      item.period_id = dateInfo.period_id;
      item[args.column.field] = state;
    };

    this.loadValue = function () { this.$input.val(defaultValue); };

    this.init();
  }

  DateEditor.prototype = new BaseEditor();

  function InvoiceEditor(args) {
    var defaultValue;

    this.init = function () {
      defaultValue = args.item.inv_po_id;
      var options = '';
      vm.invoice.data.forEach(function (invoice) {
        options += '<option value="' + invoice.uuid + '">' + invoice.uuid + ' ' + invoice.note + '</option>';
      });


      this.$input = $('<input type="text" class="editor-text" list="invoices"><datalist id="invoices">' + options + '</datalist>');
      this.$input.appendTo(args.container);
      this.$input.focus();
    };

    this.applyValue = function (item, state) {
      if (state === 'cancel') { return; }
      item[args.column.field] = state === 'clear' ? '' : state;
    };

    this.loadValue = function () { this.$input.val(defaultValue); };

    this.init();
  }

  InvoiceEditor.prototype = new BaseEditor();

  function DebCredEditor(args) {
    var defaultValue;
    var clear = '<option value="clear">Clear</option>',
        cancel = '<option value="cancel">Cancel</option>';

    this.init = function () {
      defaultValue = isDefined(args.item.deb_cred_uuid) ? args.item.deb_cred_uuid : null;
      var deb_cred_type = args.item.deb_cred_type;
      var options = '';

      // TODO : this is overly verbose
      if (deb_cred_type === 'D') {
        vm.debtor.data.forEach(function (debtor) {
          options += '<option value="' + debtor.uuid + '">[D] [' + debtor.name + '] ' + debtor.first_name + ' ' + debtor.last_name + '</option>';
          if (!defaultValue) {
            defaultValue = debtor.uuid;
          }
        });
      } else if (deb_cred_type === 'C') {
        vm.creditor.data.forEach(function (creditor) {
          options += '<option value="' + creditor.uuid + '">[C] [' + creditor.text+ '] ' + creditor.name + '</option>';
          if (!defaultValue) {
            defaultValue = creditor.uuid;
          }
        });
      } else {
        vm.debtor.data.forEach(function (debtor) {
          options += '<option value="' + debtor.uuid + '">[D] [' + debtor.name + '] ' + debtor.first_name + ' ' + debtor.last_name + '</option>';
          if (!defaultValue) {
            defaultValue = debtor.uuid;
          }
        });

        vm.creditor.data.forEach(function (creditor) {
          options += '<option value="' + creditor.uuid + '">[C] [' + creditor.text+ '] ' + creditor.name + '</option>';
          if (!defaultValue) {
            defaultValue = creditor.uuid;
          }
        });
      }

      var label = deb_cred_type === 'D' ? 'Debitor' : 'Creditor';
      options += !!options.length ? cancel + clear : '<option value="" disabled>[No ' + label + 's Found]</option>';

      this.$input= $('<SELECT class="editor-text">' + options + '</SELECT>');
      this.$input.appendTo(args.container);
      this.$input.focus();
    };

    this.applyValue = function (item,state) {
      if (state === 'cancel') { return; }
      item[args.column.field] = state === 'clear' ? '' : state;
    };

    this.loadValue = function () { this.$input.val(defaultValue); };

    this.init();
  }

  DebCredEditor.prototype = new BaseEditor();


  function AccountEditor(args) {
    var defaultValue,
        cancel = '<option value="cancel">Cancel</option>';

    this.init = function () {
      //default value - naive way of checking for previous value, default string is set, not value
      defaultValue = Number.isNaN(Number(args.item.account_number)) ? null : args.item.account_number;
      var options = '';
      vm.account.data.forEach(function (account) {
        var disabled = (account.account_type_id === 3) ? 'disabled' : '';
        options += '<option ' + disabled + ' value="' + account.account_number + '">' + account.account_number + ' ' + account.account_txt + '</option>';
        if (!defaultValue && account.account_type_id!==3) {
          defaultValue = account.account_number;
        }
      });

      options += cancel;

      this.$input = $('<SELECT class="editor-text">' + options + '</SELECT>');
      this.$input.appendTo(args.container);
      this.$input.focus();
    };

    this.loadValue = function () { this.$input.val(defaultValue); };

    this.applyValue = function (item, state) {
      if (state === 'cancel') { return; }
      item[args.column.field] = state === 'clear' ? '' : state;
    };

    this.init();
  }

  AccountEditor.prototype = new BaseEditor();

  function DebCredTypeEditor(args) {
    var defaultValue;
    var clear = '<option value="clear">Clear</option>',
        cancel = '<option value="cancel">Cancel</option>';


    this.init = function () {
      var options = ['D', 'C'];

      defaultValue = args.item.deb_cred_type;
      var concatOptions = '';

      options.forEach(function (option) {
        concatOptions += '<option value="' + option + '">' + option + '</option>';
      });

      concatOptions += clear + cancel;

      this.$input = $('<select class="editor-text">' + concatOptions + '</select>');
      this.$input.appendTo(args.container);
      this.$input.focus();
    };


    this.loadValue = function () { this.$input.val(defaultValue); };

    this.applyValue = function (item, state) {
      if (state === 'cancel') { return; }
      item[args.column.field] = state === 'clear' ? '' : state;
    };

    this.init();
  }

  DebCredTypeEditor.prototype = new BaseEditor();

  function CostCenterEditor(args) {
    var defaultValue,
        clear = '<option value="clear">Clear</option>',
        cancel = '<option value="cancel">Cancel</option>';

    this.init = function () {
      //default value - naive way of checking for previous value, default string is set, not value
      defaultValue = args.item.cc_id;
      var options = '';
      vm.cost_center.data.forEach(function (cc) {
        options += '<option  value="' + cc.id + '">[' + cc.id + '] ' + cc.text + '</option>';
      });

      options += cancel;
      options += clear;

      this.$input = $('<SELECT class="editor-text">' + options + '</SELECT>');
      this.$input.appendTo(args.container);
      this.$input.focus();
    };

    this.loadValue = function () { this.$input.val(defaultValue); };

    this.applyValue = function (item, state) {
      if (state === 'cancel') { return; }
      item[args.column.field] = (state === 'clear') ? 'null' : state;
    };

    this.init();
  }

  CostCenterEditor.prototype = new BaseEditor();

  function ProfitCenterEditor(args) {
    var defaultValue,
        clear = '<option value="clear">Clear</option>',
        cancel = '<option value="cancel">Cancel</option>';

    this.init = function () {
      //default value - naive way of checking for previous value, default string is set, not value
      var options = '';
      defaultValue = args.item.pc_id;
      vm.profit_center.data.forEach(function (pc) {
        options += '<option  value="' + pc.id + '">[' + pc.id + '] ' + pc.text + '</option>';
      });

      options += cancel;
      options += clear;

      this.$input = $('<SELECT class="editor-text">' + options + '</SELECT>');
      this.$input.appendTo(args.container);
      this.$input.focus();
    };

    this.loadValue = function () { this.$input.val(defaultValue); };

    this.applyValue = function (item, state) {
      if (state === 'cancel') { return; }
      item[args.column.field] = (state === 'clear') ? 'null' : state;
    };

    this.init();
  }

  ProfitCenterEditor.prototype = new BaseEditor();

  function getDateInfo (date) {
    var period_id, fiscal_year_id;
    var cp = normalizeDate(date);

    vm.period.data.forEach(function (period) {
      if (cp >= normalizeDate(period.period_start) && cp <= normalizeDate(period.period_stop)) {
        period_id = period.id;
        fiscal_year_id = period.fiscal_year_id;
      }
    });
    return { period_id : period_id, fiscal_year_id : fiscal_year_id };
  }

  function normalizeDate (date) {
    return new Date(date).setHours(0,0,0,0);
  }

  // Editors
  // FIXME: Is there some way to include this in another file?
  // TODO: Move to a service

  function BaseEditor() {

    this.destroy = function () { this.$input.remove(); };

    this.focus = function () { this.$input.focus(); };

    this.serializeValue = function () { return this.$input.val(); };

    this.isValueChanged = function () { return true; };

    this.validate = function () {
      return {
        valid: true,
        msg: null
      };
    };
  }  

  

  function saveTransaction () {
    var records = this.managerService.manager.session.records.data, removed = this.managerService.manager.session.removed.data;

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

      connect.fetch('/user_session')
      .then(function (res) {
        this.managerService.manager.session.userId = res.id;
        newRecords.forEach(function (rec) { rec.user_id = res.id; });
        editedRecords.forEach(function (rec) { rec.user_id = res.id; });
        return newRecords.length ? connect.post('posting_journal', newRecords) : $q.when(1);
      })
      .then(function () {
        return editedRecords.length ? editedRecords.map(function (record) { return connect.put('posting_journal', [record], ['uuid']); }) : $q.when(1);
      })
      .then(function () {
        return removedRecords.length ? connect.delete('posting_journal', 'uuid', removedRecords) : $q.when(1);
      })
      .then(function () {
        return writeJournalLog(this.managerService.manager.session);
      })
      .then(function () {
      messenger.success($translate.instant('POSTING_JOURNAL.TRANSACTION_SUCCESS')); 
        this.managerService.manager.fn.resetManagerSession();
        this.managerService.manager.fn.regroup();
        vm.grid.invalidate();
      })
      .catch(function (err) {
        messenger.danger('Submission failed' + err);
      })
      .finally();
  }

  function deleteTransaction (args) {
    var bool = $window.confirm('Are you sure you want to delete this transaction?');
    if (!bool) { return; }
    var item = this.dataviewService.dataview.getItem(args.row);
    item.rows.forEach(function (row) {
      this.managerService.manager.session.removed.post(row);
      this.managerService.manager.session.records.remove(row.uuid);
      this.dataviewService.dataview.deleteItem(row.uuid);
    });
    vm.grid.invalidate();
    saveTransaction();
  }

  

  

  // TODO : clean this f() up
  

  function doSubscription (){
    
    vm.grid.onBeforeEditCell.subscribe(function (e, args) {
      var item =  this.dataviewService.dataview.getItem(args.row),
      canEdit = this.managerService.manager.session.mode === 'edit';
      if (!canEdit || this.managerService.manager.session.transactionId !== item.trans_id ) { return false; }
    });
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
      if (!validDate(record)) { dateError = true; }
      if (!validAccountNumber(record)) { accountError = true; }
      if (!validBalance(record)) { balanceError = true; }
      if (!validDebitsAndCredits(record)) { balanceError = true; }
      if (detectSingleEntry(record)) { singleEntryError = true; }
      if (!validPeriod(record)) { periodError = true; }
      if (!validFiscal(record)) { fiscalError = true; }
    });

    var testDate = new Date(records[0].trans_date).setHours(0,0,0,0);
    multipleDatesError = records.some(function (record) {
      return new Date(record.trans_date).setHours(0,0,0,0) !== testDate;
    });

    totalDebits = precision.round(totalDebits);
    totalCredits = precision.round(totalCredits);

    if (singleEntryError) { journalError.throw('ERR_TXN_SINGLE_ENTRY'); }
    if (!validTotals(totalDebits, totalCredits)) { journalError.throw('ERR_TXN_IMBALANCE'); }
    if (accountError) { broadcastError('Records contain invalid or nonexistant accounts.'); }
    if (dateError) { broadcastError('Transaction contains invalid dates.'); }
    if (multipleDatesError) { broadcastError('Transaction trans_date field has multiple dates.'); }
    if (periodError) { broadcastError('Transaction date does not fall in any valid periods.'); }
    if (fiscalError) { broadcastError('Transaction date does not fall in any valid fiscal years.'); }

    var hasErrors = (
        dateError || accountError ||
        balanceError || singleEntryError ||
        multipleDatesError || fiscalError ||
        periodError || !validTotals(totalDebits, totalCredits)
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
        if (isDefined(record[prop]) && !isNull(record[prop])) {
          data[prop] = record[prop];
        }
      }
    }

    // FIXME : This will no longer work if we have non-unique account
    // numbers.
    if (record.account_number) { data.account_id = vm.account.get(record.account_number).id; }

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
    data.project_id = vm.project.id;
    data.origin_id = 4;

    return data;
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

  function broadcastError (desc) {
    journalError.throw(desc);
  }

  function validDate (item) {
    return isDefined(item.trans_date) && !isNaN(Date.parse(new Date(item.trans_date)));
  }

  function validDebitsAndCredits (item) {
    var credit = Number(item.credit_equiv),
        debit = Number(item.debit_equiv);
    return (isDefined(item.debit_equiv) && isDefined(item.credit_equiv)) &&
        (!isNaN(debit) || !isNaN(credit));
  }

  function validBalance (item) {
    var credit = Number(item.credit_equiv),
        debit = Number(item.debit_equiv);
    return (credit === 0 && debit > 0) || (debit === 0 && credit > 0);
  }

  function validAccountNumber (item) {
    return !isNaN(Number(item.account_number));
  }

  function validTotals (totalDebit, totalCredit) {
    return totalDebit === totalCredit;
  }

  function detectSingleEntry (item) {
    var credit = Number(item.credit_equiv),
        debit = Number(item.debit_equiv);
    return credit === 0 && debit === 0;
  }

  function validPeriod (item) {
    return !isNaN(Number(item.period_id));
  }

  function validFiscal(item) {
    return !isNaN(Number(item.fiscal_year_id));
  }
};

PostingJournalController.$inject = ['$translate', '$filter', '$q', 'precision', 'SessionService', 'JournalDataviewService', 'JournalColumnsService', 'JournalGridService', 'JournalDataLoaderService', 'liberror', 'messenger', 'store', 'connect', '$window', 'uuid', '$rootScope', 'util', 'JournalManagerService'];
angular.module('bhima.controllers').controller('PostingJournalController', PostingJournalController);












