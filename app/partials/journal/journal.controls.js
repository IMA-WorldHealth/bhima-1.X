angular.module('kpk.controllers')
.controller('journal.controls', [
  '$scope',
  '$translate',
  '$rootScope',
  '$q',
  'validate',
  'appstate',
  'messenger',
  function ($scope, $translate, $rootScope, $q, validate, appstate, messenger) {
    var dependencies = {};
    var columns, options, dataview, grid, manager;
    var sort_column;

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

      // set up grid sorting

      grid.onSort.subscribe(function(e, args) {
        sort_column = args.sortCol.field;
        dataview.sort(sort, args.sortAsc);
      });

      // set up click handling

      grid.onClick.subscribe(function(e, args) {
        handleClick(e.target.className, args);
      });
    }

    function handleErrors (error) {
      messenger.danger('An error occured ' + JSON.stringify(error));
    }

    function handleClick(className, args) {
      var buttonMap = {
        'splitTransaction': splitTransaction,
        'split': split,
        'submitSplit': submitSplit
      };
      if (buttonMap[className]) { buttonMap[className](args); }
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

      grid.render();
      $rootScope.$apply(messenger.success('Transaction #' + transactionId));
    }

    function sort (a,b) {
      var x, y;
      if (sort_column === 'trans_id') {
        x = parseFloat(a[sort_column].substr(3));
        y = parseFloat(b[sort_column].substr(3));
      } else {
        x = a[sort_column];
        y = b[sort_column];
      }
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

    function handleClick(className, args) {
      var buttonMap = {
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

  }
]);
