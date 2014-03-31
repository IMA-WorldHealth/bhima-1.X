angular.module('kpk.controllers')
.controller('journal.controls', [
  '$scope',
  '$translate',
  '$rootScope',
  '$q',
  '$filter',
  'uuid',
  'store',
  'util',
  'connect',
  'precision',
  'validate',
  'appstate',
  'messenger',
  function ($scope, $translate, $rootScope, $q, $filter, uuid, Store, util, connect, precision, validate, appstate, messenger) {
    var dependencies = {};
    var columns, options, dataview, grid, manager;
    var sort_column;

    $scope.editing = false;

    function isNull (t) { return t === null; }

    function clone (o) { return JSON.parse(JSON.stringify(o)); }

    dependencies.account = {
      query : {
        'identifier' : 'account_number',
        'tables' : {
          'account' : { 'columns' : ['id', 'account_number', 'account_type_id', 'account_txt'] }
        }
      }
    };

    dependencies.debtor = {
      query: {
        identifier : 'uuid',
        'tables' : {
          'debitor' : { 'columns' : ['uuid'] },
          'patient' : { 'columns' : ['first_name', 'last_name'] },
          'debitor_group' : { 'columns' : ['name'] },
          'account' : { 'columns' : ['account_number'] }
        },
        join: ['debitor.uuid=patient.debitor_uuid', 'debitor_group.uuid=debitor.group_uuid', 'debitor_group.account_id=account.id']
      }
    };

    dependencies.creditor = {
      query: {
        'tables' : {
          'creditor' : { 'columns' : ['uuid', 'text'] },
          'creditor_group' : { 'columns' : ['name'] },
          'account' : { 'columns' : ['account_number'] }
        },
        join: ['creditor.group_uuid=creditor_group.uuid','creditor_group.account_id=account.id']
      }
    };

    dependencies.invoice = {
      query: {
        identifier : 'uuid',
        tables : {
          sale : { columns : ['uuid', 'note'] }
        }
      }
    };

    appstate.register('project', function (project) {
      $scope.project = project;
    });

    appstate.register('journal.ready', function (ready) {
      ready.then(function (params) {
        grid = params[0];
        columns = params[1];
        dataview = params[2];
        options = params[3];
        manager = params[4];
        return validate.process(dependencies);
      })
      .then(initialise)
      .catch(handleErrors);
    });

    function initialise (models) {
      for (var k in models) { $scope[k] = models[k]; }

      $scope.journal = new Store({ data : dataview.getItems() });

      var editors = {
        'trans_date'    : DateEditor, // SlickGrids date editors uses $() datepicker
        'account_id'    : AccountEditor,
        'deb_cred_uuid' : DebCredEditor,
        'deb_cred_type' : DebCredTypeEditor,
        'inv_po_id'     : InvoiceEditor
      };

      columns.forEach(function (column) {
        if (editors[column.id]) { column.editor = editors[column.id]; }
      });

      grid.setColumns(columns);

      // set up grid sorting

      grid.onSort.subscribe(function(e, args) {
        sort_column = args.sortCol.field;
        dataview.sort(sort, args.sortAsc);
      });

      // set up click handling

      grid.onClick.subscribe(function(e, args) {
        handleClick(e.target.className, args);
      });

      // set up editing
      grid.onBeforeEditCell.subscribe(function (e, args) {
        var item =  dataview.getItem(args.row),
            canEdit = manager.editable || manager.state === "editing";
        if (!canEdit || manager.transactionId !== item.trans_id ) { return false; }
      });
    }

    function handleErrors (error) {
      messenger.danger('An error occured ' + JSON.stringify(error));
    }

    function sort (a,b) {
      var x = sort_column === 'trans_id' ? parseFloat(a[sort_column].substr(3)) : [sort_column];
      var y = sort_column === 'trans_id' ? parseFloat(b[sort_column].substr(3)) : b[sort_column];
      return (x === y) ? 0 : (x > y ? 1 : -1);
    }


    function handleClick(className, args) {
      var buttonMap = {
        'addRow'          : addRow,
        'editTransaction' : editTransaction,
        'initEditing'     : initEditing,
        'save'            : save
      };
      if (buttonMap[className]) { buttonMap[className](args); }
    }


    function addRow () {
      $scope.journal.recalculateIndex();
      var _uuid = uuid();
      var transactionLine = clone(manager.template);
      transactionLine.newRecord = true;

      transactionLine.uuid = _uuid;
      manager.records.push(transactionLine);

      dataview.addItem(transactionLine);
      //grid.scrollRowToTop(dataview.getRowById(transactionLine.uuid));
    }

    function initEditing(args) {
      var transaction = dataview.getItem(args.row);
      manager.transactionId = transaction.groupingKey;
      manager.editable = false;
      manager.toggleEditorLock();
      editTransaction(args);
    }

    function editTransaction(args) {
      var transaction = dataview.getItem(args.row),
          transactionId = transaction.groupingKey,
          templateRow = transaction.rows[0];

      if (!transactionId) return $rootScope.$apply(messenger.danger('Invalid transaction provided'));
      if (manager.state) return $rootScope.$apply(messenger.info('Transaction ' + manager.transaction_id + ' is currently being edited. Complete this transaction to continue.'));

      manager.state = 'editing';

      manager.origin = {
        'debit'        : transaction.totals.sum.debit,
        'credit'       : transaction.totals.sum.credit,
        'debit_equiv'  : transaction.totals.sum.debit_equiv,
        'credit_equiv' : transaction.totals.sum.credit_equiv
      };

      manager.records = [];

      manager.template = {
        trans_id       : transactionId,
        fiscal_year_id : templateRow.fiscal_year_id,
        period_id      : templateRow.period_id,
        trans_date     : templateRow.trans_date,
        description    : templateRow.description,
        project_id     : templateRow.project_id,
        account_number : "(Select Account)",
        debit_equiv    : 0,
        credit_equiv   : 0,
        debit          : 0,
        credit         : 0,
        inv_po_id      : templateRow.inv_po_id,
        currency_id    : templateRow.currency_id,
        userId         : 13 // FIXME
      };

      transaction.rows.forEach(function(row) {
        row.newRecord = false;
        manager.records.push(row);
      });

      manager.regroup();
      grid.render();
      $rootScope.$apply(messenger.success('Transaction #' + transactionId));
    }

    function broadcastError (msg) {
      $rootScope.$apply(messenger.danger("[ERROR]" + msg));
    }

    function broadcastSuccess (msg) {
      $rootScope.$apply(messenger.success(msg));
    }

    function packager (record) {
      var data = {}, cpProperties, prop;
      cpProperties = [
        'uuid', 'project_id', 'trans_id', 'trans_date', 'period_id', 'description', 'account_id',
        'credit', 'debit', 'debit_equiv', 'credit_equiv', 'fiscal_year_id', 'currency_id',
        'deb_cred_id', 'deb_cred_type', 'inv_po_id', 'user_id', 'origin_id'
      ];

      for (prop in record) {
        if (~cpProperties.indexOf(prop)) {
          if (angular.isDefined(record[prop]) && !isNull(record[prop])) {
            data[prop] = record[prop];
          }
        }
      }

      if (record.account_number) { data.account_id = $scope.account.get(record.account_number).id; }
      // FIXME : Review this decision
      data.project_id = $scope.project.id;
      data.origin_id = 4;

      return data;

    }

    function save () {
      var records = manager.records;
      var totalDebits = 0, totalCredits = 0;
      var validAccounts = true;
      var validDates = true;
      var zeroTransaction = false;
      var singleEntry = false;
      var packagedRecords = [],
          requestNew = [],
          requestUpdate = [],
          request = [];

      var enterpriseSettings = appstate.get('enterprise'),
          fiscalSettings = appstate.get('fiscal');

      //validation
      records.forEach(function(record) {
        totalDebits += precision.round(Number(record.debit_equiv));
        totalCredits += precision.round(Number(record.credit_equiv));
        var account_number = Number(record.account_number);
        if (Number.isNaN(account_number)) validAccounts = false;
        if (Number(record.debit_equiv) === 0 && Number(record.credit_equiv) === 0) { zeroTransaction = true; }
        if (Number(record.debit_equiv) !== 0 && Number(record.credit_equiv) !== 0) { singleEntry = true; }
        if (isNaN(Date.parse(new Date(record.trans_date)))) { validDates = false; }
      });

      totalDebits = precision.round(totalDebits);
      totalCredits = precision.round(totalCredits);

      if (singleEntry) return broadcastError('Transaction contains both debits and credits on the same line.');
      if (zeroTransaction) return broadcastError('Transaction contains records with no debit or credit value.');
      if (totalDebits !== totalCredits) return broadcastError('Transaction debits and credits do not balance.');
      if (!validAccounts) return broadcastError('Records contain invalid accounts');
      if (!fiscalSettings) return broadcastError('Fiscal records are invalid');

      broadcastSuccess('All tests passed');

      var newRecords = [];
      var editedRecords = [];

      records.forEach(function(record) {
        var newRecord = record.newRecord;
        var packed = packager(record);
        (newRecord ? newRecords : editedRecords).push(packed);
      });

      connect.fetch('/user_session')
      .success(function (res) {
        var user_id = res.id;
        newRecords.forEach(function (rec) { rec.user_id = user_id; });
        editedRecords.forEach(function (rec) { rec.user_id = user_id; });
        return newRecords.length ? connect.basicPut('posting_journal', newRecords) : $q.when(1);
      })
      .then(function () {
        return editedRecords.map(function (record) { return connect.basicPost('posting_journal', [record], ['uuid']); });
      })
      .then(function () {
        messenger.success('Transaction edits written to database');
        manager.state = null;
        manager.transactionId = null;
        manager.toggleEditorLock();
        manager.toggleEditMode();
        manager.editable = false; // FIXME : this should be done by a toggle.
        manager.regroup();
        grid.invalidate();
        grid.render();
      })
      .catch(function (err) {
        messenger.danger("Submission failed" + err);
      });
    }

    function writeJournalLog (details) {
      var deferred = $q.defer(),
          logId = details.logId,
          justification = details.template.description,
          date = util.convertToMysqlDate(),
          user = details.template.userId,
          transaction = details.transaction_id;

      //console.log(details, justification, date, user);
      var packagedLog = {
        transaction_id : transaction,
        note           : justification,
        date           : date,
        user_id        : user
      };

      connect.basicPut('journal_log', [packagedLog])
      .then(function(result) {
        manager.logId = result.data.insertId;
        deferred.resolve(result);
        //console.log('log was written', result);
      })
      .catch(function (err) { deferred.reject(err); });

      return deferred.promise;
    }

    // Editors

    function BaseEditor () {

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

    function DateEditor (args) {
      var defaultValue;

      this.init = function () {
        defaultValue = args.item.trans_date;
        this.$input = $("<input class='editor-text' type='date'>");
        this.$input.appendTo(args.container);
        this.$input.focus();
      };

      this.applyValue = function(item,state) {
        var e = util.convertToMysqlDate(new Date(state));
        item[args.column.field] = e;
      };

      this.loadValue = function (item) { this.$input.val(defaultValue); };

      this.init();
    }

    DateEditor.prototype = new BaseEditor();

    function InvoiceEditor(args) {
      var clear = "<option value='clear'>Clear</option>",
          cancel = "<option value='cancel'>Cancel</option>",
          defaultValue;


      this.init = function () {
        defaultValue = args.item.inv_po_id;
        var options = "";
        $scope.invoice.data.forEach(function (invoice) {
          options += '<option value="' + invoice.uuid + '">' + invoice.uuid + ' ' + invoice.note + '</option>';
        });

        var label = 'Invoice';

        this.$input = $("<input type='text' class='editor-text' list='invoices'><datalist id='invoices'>" + options + "</datalist>");
        this.$input.appendTo(args.container);
        this.$input.focus();
      };

      this.applyValue = function(item,state) {
        if (state === 'cancel') { return; }
        item[args.column.field] = state === 'clear' ? '' : state;
      };

      this.loadValue = function (item) { this.$input.val(defaultValue); };

      this.init();
    }

    InvoiceEditor.prototype = new BaseEditor();

    function DebCredEditor (args) {
      var $select, defaultValue;
      var clear = "<option value='clear'>Clear</option>",
          cancel = "<option value='cancel'>Cancel</option>";

      this.init = function () {
        defaultValue = angular.isDefined(args.item.deb_cred_uuid) ? args.item.deb_cred_uuid : null;
        var deb_cred_type = args.item.deb_cred_type;
        var options = "";

        if (deb_cred_type === 'D') {
          $scope.debtor.data.forEach(function(debtor) {
            options += '<option value="' + debtor.uuid + '">[D] [' + debtor.name + '] ' + debtor.first_name + ' ' + debtor.last_name + '</option>';
            if (!defaultValue) {
              defaultValue = debtor.uuid;
            }
          });
        } else if (deb_cred_type === 'C') {
          $scope.creditor.data.forEach(function (creditor) {
            options += '<option value="' + creditor.uuid + '">[C] [' + creditor.text+ '] ' + creditor.name + '</option>';
            if(!defaultValue) {
              defaultValue = creditor.uuid;
            }
          });
        } else {
          $scope.debtor.data.forEach(function(debtor) {
            options += '<option value="' + debtor.uuid + '">[D] [' + debtor.name + '] ' + debtor.first_name + ' ' + debtor.last_name + '</option>';
            if(!defaultValue) {
              defaultValue = debtor.uuid;
            }
          });

          $scope.creditor.data.forEach(function (creditor) {
            options += '<option value="' + creditor.uuid + '">[C] [' + creditor.text+ '] ' + creditor.name + '</option>';
            if(!defaultValue) {
              defaultValue = creditor.uuid;
            }
          });
        }

        var label = deb_cred_type === 'D' ? 'Debitor' : 'Creditor';
        options += !!options.length ? cancel + clear : "<option value='' disabled>[No " + label + "s Found]</option>";

        $select = $("<SELECT class='editor-text'>" + options + "</SELECT>");
        $select.appendTo(args.container);
        $select.focus();
      };

      this.destroy = function () { $select.remove(); };

      this.focus = function () { $select.focus(); };

      this.loadValue = function (item) { $select.val(defaultValue); };

      this.serializeValue = function () { return $select.val(); };

      this.applyValue = function(item,state) {
        if (state === 'cancel') { return; }
        item[args.column.field] = state === 'clear' ? '' : state;
      };

      this.isValueChanged = function () { return true; };

      this.validate = function () {
        return {
          valid: true,
          msg: null
        };
      };

      this.init();
    }


    function AccountEditor (args) {
      var defaultValue;
      var clear = "<option value='clear'>Clear</option>",
          cancel = "<option value='cancel'>Cancel</option>";

      this.init = function () {
        //default value - naive way of checking for previous value, default string is set, not value
        defaultValue = Number.isNaN(Number(args.item.account_number)) ? null : args.item.account_number;
        var options = "";
        $scope.account.data.forEach(function(account) {
          var disabled = (account.account_type_id === 3) ? 'disabled' : '';
          options += '<option ' + disabled + ' value="' + account.account_number + '">' + account.account_number + ' ' + account.account_txt + '</option>';
          if(!defaultValue && account.account_type_id!==3) {
            defaultValue = account.account_number;
          }
        });

        options += cancel;

        this.$input = $("<SELECT class='editor-text'>" + options + "</SELECT>");
        this.$input.appendTo(args.container);
        this.$input.focus();
      };

      this.loadValue = function (item) { this.$input.val(defaultValue); };

      this.applyValue = function(item,state) {
        if (state === 'cancel') { return; }
        console.log("state", state, args.column.field);
        item[args.column.field] = state === 'clear' ? '' : state;
      };

      this.init();

    }

    AccountEditor.prototype = new BaseEditor();

    function DebCredTypeEditor (args) {
      var defaultValue;
      var clear = "<option value='clear'>Clear</option>",
          cancel = "<option value='cancel'>Cancel</option>";


      this.init = function () {
        var options = ["D", "C"];

        defaultValue = args.item.deb_cred_type;
        var concatOptions = "";

        options.forEach(function(option) {
          concatOptions += "<option value='" + option + "'>" + option + "</option>";
        });

        concatOptions += clear + cancel;

        this.$input = $('<select class="editor-text">' + concatOptions + "</select>");
        this.$input.appendTo(args.container);
        this.$input.focus();
      };


      this.loadValue = function (item) { this.$input.val(defaultValue); };

      this.applyValue = function(item,state) {
        if (state === 'cancel') { return; }
        item[args.column.field] = state === 'clear' ? '' : state;
      };

      this.init();
    }

    DebCredTypeEditor.prototype = new BaseEditor();
  }
]);
