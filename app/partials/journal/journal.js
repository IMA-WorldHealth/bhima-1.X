//TODO Lot's of hardcoded areas throughout editing process (marked with fixme). State is dependent on strings etc.
angular.module('kpk.controllers').controller('journal', [
  '$scope',
  '$rootScope',
  '$translate',
  '$compile',
  '$timeout',
  '$filter',
  '$q',
  '$http',
  '$location',
  '$modal',
  'connect',
  'validate',
  'messenger',
  'appstate',
  function ($scope, $rootScope, $translate, $compile, $timeout, $filter, $q, $http, $location, $modal, connect, validate, messenger, appstate) {
    var dependencies = {},
      liveTransaction = $scope.liveTransaction = {},
      grid,
      dataview,
      sort_column,
      columns,
      options;

    dependencies.journal = {
      // FIXME
      // required: true,
      query: {
        identifier : 'uuid',
        'tables' : {
          'posting_journal' : {
            'columns' : ["uuid", "trans_id", "trans_date", "doc_num", "description", "account_id", "debit", "credit", "currency_id", "deb_cred_uuid", "deb_cred_type", "inv_po_id", "debit_equiv", "credit_equiv", "currency_id"]
          },
          'account' : { 'columns' : ["account_number"] }
        },
        join: ["posting_journal.account_id=account.id"]
      }
    };

    dependencies.account = {
      query : {
        'tables' : {
          'account' : { 'columns' : ['id', 'account_number', 'account_type_id', 'account_txt'] }
        },
        identifier: 'account_number'
      }
    };

    dependencies.debtor = {
      query: {
        identifier : 'uiud',
        'tables' : {
          'debitor' : { 'columns' : ['uuid'] },
          'patient' : { 'columns' : ['first_name', 'last_name'] }
        },
        join: ['debitor.uuid=patient.debitor_uuid']
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

    dependencies.creditor = {
      query: {
        'tables' : {
          'creditor' : { 'columns' : ['uuid'] },
          'supplier' : { 'columns' : ['name'] }
        },
        join: ['creditor.uuid=supplier.creditor_uuid']
      }
    };

    function journal(model) {
      $scope.model = model;
      defineGridOptions();
      initialiseGrid();
    }

    validate.process(dependencies).then(journal);

    function defineGridOptions() {
      sort_column = "trans_id";
      columns = [
        {id: 'uuid', name : $filter('translate')('COLUMNS.ID'), field: 'uuid', sortable : true},
        {id: 'trans_id', name: $filter('translate')('COLUMNS.TRANS_ID'), field: 'trans_id', sortable: true},
        {id: 'trans_date', name: $filter('translate')('COLUMNS.DATE'), field: 'trans_date', formatter: formatDate},
        // {id: 'doc_num', name: 'Doc No.', field: 'doc_num', maxWidth: 75},
        {id: 'description', name: $filter('translate')('COLUMNS.DESCRIPTION'), field: 'description', width: 110, editor: Slick.Editors.Text },
        {id: 'account_id', name: $filter('translate')('COLUMNS.ACCOUNT_NUMBER'), field: 'account_number', sortable: true, editor:SelectCellEditor},
        // {id: 'debit', name: 'Debit', field: 'debit', groupTotalsFormatter: totalFormat, sortable: true, maxWidth:100},
        // {id: 'credit', name: 'Credit', field: 'credit', groupTotalsFormatter: totalFormat, sortable: true, maxWidth: 100},
        {id: 'debit_equiv', name: $filter('translate')('COLUMNS.DEB_EQUIV'), field: 'debit_equiv', groupTotalsFormatter: totalFormat, sortable: true, maxWidth:100, editor:Slick.Editors.Text},
        {id: 'credit_equiv', name: $filter('translate')('COLUMNS.CRE_EQUIV'), field: 'credit_equiv', groupTotalsFormatter: totalFormat, sortable: true, maxWidth: 100, editor:Slick.Editors.Text},
        {id: 'deb_cred_uuid', name: 'AR/AP Account', field: 'deb_cred_uuid', editor:SelectCellEditor},
        {id: 'deb_cred_type', name: $filter('translate')('COLUMNS.DC_TYPE'), field: 'deb_cred_type', editor:SelectCellEditor},
        {id: 'inv_po_id', name: $filter('translate')('COLUMNS.INVPO_ID'), field: 'inv_po_id', editor:SelectCellEditor}
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

      grid = new Slick.Grid('#journal_grid', dataview, columns, options);

      grid.registerPlugin(groupItemMetadataProvider);
      grid.setSelectionModel(new Slick.RowSelectionModel({selectActiveRow: false}));

      // grid.setSelectionModel(new Slick.CellSelectionModel());

      grid.onSort.subscribe(function(e, args) {
        sort_column = args.sortCol.field;
        dataview.sort(sort_column ===  'trans_id' ? transIdSort : compareSort, args.sortAsc);
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
        if(liveTransaction.state) return (row.item.trans_id === liveTransaction.transaction_id);
        return false;
      });

      grid.onCellChange.subscribe(function(e, args) {
        dataview.updateItem(args.item.id, args.item);
      });

      grid.onClick.subscribe(function(e, args) {
        handleClick(e.target.className, args);

      });

      dataview.beginUpdate();
      dataview.setItems($scope.model.journal.data, 'uuid');
      dataview.endUpdate();

      //default grouping
      groupBy('transaction');

      // allow the user to select only certain columns shown
      $scope.columns = angular.copy(columns)
        .filter(function (column) {
          // This is a hack to remove the checkbox column definition
          // out of the ui selections.
          return column.id !== '_checkbox_selector';
        })
        .map(function (column) {
          column.visible = true;
          return column;
        });
    }

    $scope.$watch('columns', function () {
      if (!$scope.columns) return;
      var columns = $scope.columns.filter(function (column) { return column.visible; });
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
    }

    function formatTransactionGroup(g) {
      var rowMarkup,
          splitTemplate,
          firstElement = g.rows[0];

      if(liveTransaction.state === "add") {
        if(firstElement.trans_id === liveTransaction.transaction_id) {
          //markup for editing
          rowMarkup =
            "<span style='color: red;'><span style='color: red;' class='glyphicon glyphicon-pencil'> </span> " + $translate("POSTING_JOURNAL.LIVE_TRANSACTION") + " " + g.value + " (" + g.count + " records)</span><div class='pull-right'><a class='addLine'><span class='glyphicon glyphicon-plus'></span> Add Line</a><a style='margin-left: 15px;' class='submitTransaction'><span class='glyphicon glyphicon-floppy-save'></span> Submit Transaction</a></div>";
          return rowMarkup;
        }
      }

      if(liveTransaction.state === "split") {
        if(firstElement.trans_id === liveTransaction.transaction_id) {
          rowMarkup = "<span style='color: red;'><span style='color: red' class='glyphicon glyphicon-pencil'> </span> "+ $translate("POSTING_JOURNAL.LIVE_TRANSACTION") + " "  + g.value + " (" + g.count + " records)</span> Total Transaction Credit: <b>" + $filter('currency')(liveTransaction.origin.credit_equiv) + "</b> Total Transaction Debit: <b>" + $filter('currency')(liveTransaction.origin.debit_equiv) + "</b> <div class='pull-right'><a class='split'><span class='glyphicon glyphicon-plus'></span> Split</a><a style='margin-left: 15px;' class='submitSplit'><span class='glyphicon glyphicon-floppy-save'></span> Save Transaction</a></div>";
          return rowMarkup;
        }
      }

      splitTemplate = "<div class='pull-right'><a class='splitTransaction'> " + $translate("POSTING_JOURNAL.SPLIT_TRANSACTION") + " </a></div>";
      rowMarkup = "<span style='font-weight: bold'>" + g.value + "</span> (" + g.count + " records)</span>";

      //FIXME
      // if(!liveTransaction.state) rowMarkup += splitTemplate;
      rowMarkup += splitTemplate;
      return rowMarkup;
    }

    function groupByAccount () {
      dataview.setGrouping({
        getter: "account_id",
        formatter: function(g) {
          var account_txt = $scope.model.account.get(g.rows[0].account_number).account_txt || "";
          return "<span style='font-weight: bold'>" + ( $scope.model.account ? account_txt : g.value) + "</span>";
        },
        aggregators: [
          new Slick.Data.Aggregators.Sum("debit"),
          new Slick.Data.Aggregators.Sum("credit"),
          new Slick.Data.Aggregators.Sum("debit_equiv"),
          new Slick.Data.Aggregators.Sum("credit_equiv")
        ],
        aggregateCollapsed: false
      });
    }

    $scope.removeGroup = function removeGroup() {
      dataview.setGrouping({});
    };

    $scope.trialBalance = function () {
      // Runs the trial balance
      // first, we need to validate that all items in each trans have been
      // selected.

      connect.fetch('/trialbalance/initialize')
      .then(function (res) {
        var instance = $modal.open({
          // this should not close on off click
          backdrop: 'static',
          // do not let esc key close modal
          keyboard : false,
          templateUrl:'trialBalanceModal.html',
          controller: 'trialBalance',
          resolve : {
            request: function () {
              return res.data;
            }
          }
        });

        instance.result.then(function () {
          //console.log("modal closed successfully.");
          $location.path('/reports/ledger/general_ledger');
        }, function () {
          //console.log("modal closed.");
        });

      })
      .catch(function (error) {
        messenger.danger('Trailbalance failed with ' + JSON.stringify(error));
      });
    };

    function compareSort(a, b) {
      var x = a[sort_column], y = b[sort_column];
      return (x === y) ? 0 : (x > y ? 1 : -1);
    }

    function transIdSort(a,b) {
      var x = Number(a[sort_column].substr(3)), y = Number(b[sort_column].substr(3));
      return (x === y) ? 0 : (x > y ? 1 : -1);
    }

    function formatDate (row, col, item) {
      return $filter('date')(item);
    }

    function totalFormat(totals, column) {

      var format = {};
      format.Credit = '#F70303';
      format.Debit = '#02BD02';
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

    function handleClick(className, args) {
      var buttonMap = {
        'addLine': newLine,
        'submitTransaction': submitTransaction,
        'splitTransaction': splitTransaction,
        'split': split,
        'submitSplit': submitSplit
      };
      if(buttonMap[className]) buttonMap[className](args);
    }

    function splitTransaction(args) {
      var verifyTransaction, transaction = dataview.getItem(args.row),
          transactionId = Number(transaction.groupingKey),
          templateRow = transaction.rows[0];

      if(!transactionId) return $rootScope.$apply(messenger.danger('Invalid transaction provided'));
      if(liveTransaction.state) return $rootScope.$apply(messenger.info('Transaction ' + liveTransaction.transaction_id + ' is currently being edited. Complete this transaction to continue.'));

      verifyTransaction = $modal.open({
        backdrop: 'static',
        keyboard : false,
        templateUrl: "verifyTransaction.html",
        controller: 'verifyTransaction',
        resolve : {
          updateType : 'split',
          transaction : transactionId
        }
      });
      verifyTransaction.result.then(initialiseSplit, handleError);
    }

    function initialiseSplit(template) {

    }

    function splitTransaction(args) {
      var transaction = dataview.getItem(args.row), transactionId = Number(transaction.groupingKey), templateRow = transaction.rows[0];
      if(!transactionId) return $rootScope.$apply(messenger.danger('Invalid transaction provided'));
      if(liveTransaction.state) return $rootScope.$apply(messenger.info('Transaction ' + liveTransaction.transaction_id + ' is currently being edited. Complete this transaction to continue.'));

      liveTransaction.state = "split";
      liveTransaction.transaction_id = transactionId;

      liveTransaction.origin = {
        'debit' : transaction.totals.sum.debit,
        'credit' : transaction.totals.sum.credit,
        'debit_equiv' : transaction.totals.sum.debit_equiv,
        'credit_equiv' : transaction.totals.sum.credit_equiv
      };

      liveTransaction.records = [];

      liveTransaction.template = {
        trans_id: transactionId,
        trans_date: templateRow.trans_date,
        description: templateRow.description,
        account_number: "(Select Account)",
        debit_equiv: 0,
        credit_equiv: 0,
        // deb_cred_type: templateRow.deb_cred_type,
        // deb_cred_id: templateRow.deb_cred_id,
        inv_po_id: templateRow.inv_po_id,
        currency_id: templateRow.currency_id,
        userId: 13 //FIXME
        // enterprise_id: templateRow.enterprise_id,
        // fiscal_year_id: templateRow.fiscal_year_id,
        // period_id: templateRow.period_id
      };

      transaction.rows.forEach(function(row) {
        row.newTransaction = false;
        liveTransaction.records.push(row);
      });

      groupBy('transaction');
      grid.render();
      $rootScope.$apply(messenger.success('Transaction #' + transactionId));
    }

    function split() {
      var temporaryId = generateId($scope.model.journal.data, 'trans_id');
      var newsplit = JSON.parse(JSON.stringify(liveTransaction.template));

      newsplit.id = temporaryId;
      newsplit.newTransaction = true;

      dataview.addItem(newsplit);
      liveTransaction.records.push(newsplit);
      $scope.model.journal.recalculateIndex();

      grid.scrollRowIntoView(dataview.getRowById(newsplit.id));
    }

    //TODO Both submit function have similar structure, but differ on tests and put/post, exract pattern
    function submitSplit() {
      var records = liveTransaction.records;
      var totalDebits = 0, totalCredits = 0;
      var validAccounts = true;
      var packagedRecords = [], requestNew = [], requestUpdate = [], request = [];
      var enterpriseSettings = appstate.get('enterprise'), fiscalSettings = appstate.get('fiscal'); //TODO no exception handling

      //validation
      records.forEach(function(record) {

        totalDebits += dbRound(Number(record.debit_equiv));
        totalCredits += dbRound(Number(record.credit_equiv));

        var account_number = Number(record.account_number);
        if(isNaN(account_number)) validAccounts = false;
      });

      totalDebits = dbRound(totalDebits);
      totalCredits = dbRound(totalCredits);

      if(!validAccounts) return $rootScope.$apply(messenger.danger('Records contain invalid accounts'));

      if(!(totalDebits === liveTransaction.origin.debit_equiv && totalCredits === liveTransaction.origin.credit_equiv)) return $rootScope.$apply(messenger.danger('Transaction Debit/Credit value has changed'));

      if(!fiscalSettings) return $rootScope.$apply(messenger.danger('Fiscal records are invalid'));

      $rootScope.$apply(messenger.success('All tests passed'));

      records.forEach(function(record) {

        //console.log('currency', record.currency_id);
        var newRecord = record.newTransaction;

        var packageChanges = {
          description: record.description,
          debit_equiv: record.debit_equiv,
          credit_equiv: record.credit_equiv,
        };

        packageChanges.account_id = $scope.model.account.get(record.account_number).id;

        if(newRecord) {

          //console.log('new record', record, record.currency_id);
          packageChanges.deb_cred_type = record.deb_cred_type;
          if(record.deb_cred_id) packageChanges.deb_cred_id = record.deb_cred_id;
          if(record.inv_po_id) packageChanges.inv_po_id = record.inv_po_id;
          packageChanges.credit = record.credit_equiv;
          packageChanges.debit = record.debit_equiv;
          packageChanges.trans_date = record.trans_date;
          packageChanges.trans_id = record.trans_id;
          packageChanges.period_id = fiscalSettings.period_id;
          packageChanges.fiscal_year_id = fiscalSettings.id;
          packageChanges.enterprise_id = enterpriseSettings.id;
          if(record.currency_id) packageChanges.currency_id = record.currency_id;
          packageChanges.origin_id = 4; //FIXME Coded pretty hard, origin_id is supposed to reference transaction_type
          packageChanges.user_id = liveTransaction.template.userId;

          return request.push(connect.basicPut('posting_journal', [packageChanges]));
        }
        packageChanges.id = record.id;
        request.push(connect.basicPost('posting_journal', [packageChanges], ['id']));
      });

      //console.log('req', request);
      $q.all(request).then(function(res) {
        messenger.success('Transaction split written to database');
        liveTransaction.state = null;
        groupBy('transaction');
        grid.invalidate();
        grid.render();

      }, function(err) { messenger.danger("Split submission failed"); });
    }

    //TODO Currently checks for balance and for NULL values, should include only credits or debits etc.
    function submitTransaction() {
      var records = liveTransaction.records;
      var totalDebits = 0, totalCredits = 0;
      var validAccounts = true;
      var packagedRecords = [], request = [];
      var enterpriseSettings = appstate.get('enterprise'), fiscalSettings = appstate.get('fiscal'); //TODO no exception handling

      //validation
      records.forEach(function(record) {

        totalDebits += dbRound(Number(record.debit_equiv));
        totalCredits += dbRound(Number(record.credit_equiv));

        var account_number = Number(record.account_number);
        var deb_cred_id = Number(record.deb_cred_id);

        if(isNaN(account_number)) validAccounts = false;

        //leave deb/cred optional for now
      });

      totalDebits = dbRound(totalDebits);
      totalCredits = dbRound(totalCredits);

      if(!validAccounts) {
        return $rootScope.$apply(messenger.danger('Records contain invalid accounts'));
      }

      if(totalDebits !== totalCredits) {
        return $rootScope.$apply(messenger.danger('Transaction debits and credits do not match' + totalDebits + ' ' + totalCredits));
      }

      if(!fiscalSettings) return $rootScope.$apply(messenger.danger('Fiscal records are invalid'));

      writeJournalLog(liveTransaction).then(function(result) {

        //Package and submit records
        records.forEach(function(record) {
          record.currency_id = enterpriseSettings.currency_id;
          var packaged = {
            enterprise_id: enterpriseSettings.id,
            fiscal_year_id: fiscalSettings.id,
            period_id: fiscalSettings.period_id,
            trans_id: record.trans_id,
            trans_date: record.trans_date,
            description: record.description,
            debit: record.debit_equiv,
            credit: record.credit_equiv,
            debit_equiv: record.debit_equiv,
            credit_equiv: record.credit_equiv,
            deb_cred_type: record.deb_cred_type,
            origin_id: 4, //FIXME Coded pretty hard, origin_id is supposed to reference transaction_type
            currency_id: record.currency_id,
            user_id: liveTransaction.template.userId
          };

          //console.log(packaged);
          if (record.inv_po_id) {
            packaged.inv_po_id = record.inv_po_id;
          }

          packaged.account_id = $scope.model.account.get(record.account_number).id;
          if(!isNaN(Number(record.deb_cred_id))) {
            packaged.deb_cred_id = record.deb_cred_id;
          } else {
            //reset record on client
            record.deb_cred_id = null;
          }

          request.push(connect.basicPut("posting_journal", [packaged]));
        });

        //submit
        $q.all(request).then(function(res) {
          messenger.success('Transaction posted to journal. Journal Log Ref #' + liveTransaction.logId);
          liveTransaction.state = null;
          groupBy('transaction');
          grid.invalidate();
          grid.render();
        }, function(err) { messenger.danger(err.code); });
      }, function(err) { messenger.danger(err.code); });
    }

    function writeJournalLog(details) {
      var deferred = $q.defer(), logId = details.logId, justification = details.template.description, date = mysqlDate(), user = details.template.userId, transaction = details.transaction_id;
      //console.log(details, justification, date, user);
      var packagedLog = {
        transaction_id: transaction,
        note: justification,
        date: date,
        user_id: user
      };

      connect.basicPut('journal_log', [packagedLog]).then(function(result) {
        liveTransaction.logId = result.data.insertId;
        deferred.resolve(result);

        //console.log('log was written', result);
      }, function(error) { deferred.reject(error); });

      return deferred.promise;
    }

    function addTransaction(template) {

      console.log('generateId', generateId($scope.model.journal.data, 'trans_id'));
      var initialTransaction, balanceTransaction, temporaryId = generateId($scope.model.journal.data);
      var templateTransaction = {
        trans_id: template.id,
        trans_date: template.date,
        description: template.description,
        debit_equiv: 0,
        credit_equiv: 0,
        account_number: "(Select Account)",
        deb_cred_id: null,
        deb_cred_type: null,
        userId: template.userId
      };

      liveTransaction.records = [];
      liveTransaction.logId = template.logId;

      initialTransaction = JSON.parse(JSON.stringify(templateTransaction));
      initialTransaction.id = temporaryId;

      //Duplicates object - not very intelectual
      balanceTransaction = JSON.parse(JSON.stringify(initialTransaction));
      balanceTransaction.id += 1;

      groupBy('transaction');

      liveTransaction.transaction_id = template.id;
      liveTransaction.state = "add";
      liveTransaction.template = templateTransaction;

      dataview.addItem(initialTransaction);
      dataview.addItem(balanceTransaction);

      liveTransaction.records.push(initialTransaction);
      liveTransaction.records.push(balanceTransaction);
      grid.scrollRowToTop(dataview.getRowById(initialTransaction.id));
    }

    function newLine() {

      $scope.model.journal.recalculateIndex();
      var temporaryId = generateId($scope.model.journal.data);
      var transactionLine = JSON.parse(JSON.stringify(liveTransaction.template));

      transactionLine.id = temporaryId;
      liveTransaction.records.push(transactionLine);

      dataview.addItem(transactionLine);
      grid.scrollRowToTop(dataview.getRowById(transactionLine.id));
    }

    $scope.groupBy = groupBy;
    $scope.openTransaction = openTransaction;

    //FIXME: without a delay of (roughly)>100ms slickgrid throws an error saying CSS can't be found
    //$timeout(init, 100);

    function openTransaction() {
      if(!liveTransaction.state) {
        var verifyTransaction = $modal.open({
          templateUrl: "verifyTransaction.html",
          controller: 'verifyTransaction',
          resolve : {
            updateType : 'add',
            transaction : null
          }
        });

        verifyTransaction.result.then(addTransaction, handleError);
      }
    }

    //TODO iterate thorugh columns array - apply translate to each heading and update
    //(each should go through translate initially as well)
    $scope.$on('$translateChangeSuccess', function () {
      //grid.updateColumnHeader("trans_id", $translate('GENERAL_LEDGER'));
    });

    // FIXME interesting splitting logic on select
    function SelectCellEditor(args) {
      var $select, defaultValue, scope = this;
      var id = args.column.id, targetObejct = args.item;

      //TODO use prototypal inheritence vs. splitting on init
      var fieldMap = {
        'deb_cred_id' : initDebCred,
        'account_number' : initAccountNumber,
        'deb_cred_type' : initDebCredType,
        'inv_po_id' : initInvPo
      };

      this.init = fieldMap[args.column.field];

      function initInvPo () {

        options = "";
        $scope.model.invoice.data.forEach(function (invoice) {
          options += '<option value="' + invoice.id + '">' + invoice.id + ' ' + invoice.note + '</option>';

        });

        $select = $("<SELECT class='editor-text'>" + options + "</SELECT>");
        $select.appendTo(args.container);
        $select.focus();
      }

      function initDebCred () {
        defaultValue = isNaN(Number(args.item.deb_cred_id)) ? null : args.item.deb_cred_id;

        options = "";
        $scope.model.debtor.data.forEach(function(debtor) {
          options += '<option value="' + debtor.id + '">' + debtor.id + ' ' + debtor.first_name + ' ' + debtor.last_name + '</option>';
          if(!defaultValue) {
            defaultValue = debtor.id;
          }
        });

        $select = $("<SELECT class='editor-text'>" + options + "</SELECT>");
        $select.appendTo(args.container);
        $select.focus();
      }

      function initAccountNumber() {

        //default value - naive way of checking for previous value, default string is set, not value
        defaultValue = isNaN(Number(args.item.account_number)) ? null : args.item.account_number;
        options = "";
        $scope.model.account.data.forEach(function(account) {
          var disabled = (account.account_type_id === 3) ? 'disabled' : '';
          options += '<option ' + disabled + ' value="' + account.account_number + '">' + account.account_number + ' ' + account.account_txt + '</option>';
          if(!defaultValue && account.account_type_id!==3) {
            defaultValue = account.account_number;
          }

        });

        $select = $("<SELECT class='editor-text'>" + options + "</SELECT>");
        // $select = $compile("<span><input type='text' ng-model='account_id' typeahead='thing as thing.val for thing in thislist | filter: $viewValue' class='editor-typeahead' placeholder='Account Id'></span>")($scope);
        $select.appendTo(args.container);
        $select.focus();
      }

      function initDebCredType() {
        var options = ["D", "C"];

        // FIXME Hardcoded spagetthi
        defaultValue = options[0];
        concatOptions = "";

        options.forEach(function(option) {
          concatOptions += "<option value='" + option + "'>" + option + "</option>";
        });

        $select = $('<select class="editor-text">' + concatOptions + "</select>");
        $select.appendTo(args.container);
        $select.focus();
      }

      this.destroy = function() {
        $select.remove();
      };

      this.focus = function() {
        $select.focus();
      };

      this.loadValue = function(item) {
        $select.val(defaultValue);
      };

      this.serializeValue = function() {
        return $select.val();
      };

      this.applyValue = function(item,state) {
        item[args.column.field] = state;
      };

      this.isValueChanged = function() {

        //If default value is something that shouldn't be selected
        // return ($select.val() != defaultValue);
        return true;
      };

      this.validate = function() {
        return {
          valid: true,
          msg: null
        };
      };

      this.init();
    }

    function mysqlDate (date) {
      return (date || new Date()).toISOString().slice(0,10);
    }

    function handleError(error) {
      if(error) messenger.danger(error.code);
    }

    function generateId(data, id) {
      var searchId = id || 'id';

      var maxId = data.reduce(function (a, b) {
        var aId = a[searchId] || a, bId = b[searchId] || b;
        return Math.max(aId, bId);
      });
      return maxId + 1;
    }

    function dbRound(value) {
      return Number(value.toFixed(4));
    }

  }
]);
