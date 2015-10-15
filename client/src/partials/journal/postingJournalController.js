var PostingJournalController = function ($translate, $filter, $q, precision, sessionService, dataviewService, columnsService, gridService, dataLoaderService, liberror, messenger, Store, connect, $window, uuid, $rootScope, util, managerService) {
  var vm = this;
   //declaring a variable to handle error  
  vm.managerService = managerService;
  vm.dataviewService = dataviewService;
  vm.columnsService  = columnsService;
  vm.gridService = gridService;
  vm.dataLoaderService = dataLoaderService;
  vm.grid     = gridService.buildGrid();
  vm.editing = false;
  vm.project = sessionService.project;


  vm.dataviewService.populate()
  .then(vm.dataLoaderService.loadAdditionalData)  
  .then(initialise)
  .catch(handleErrors);  
  
  function isDefined (d) { return angular.isDefined(d); }
  function handleErrors (error) {
    messenger.danger('An error occured ' + JSON.stringify(error));
  }

  function initialise (models) {
    angular.extend(vm, models);
    vm.journal = new Store({ data : vm.dataviewService.dataview.getItems() });
    vm.dataviewService.subscribeToOnRowCountChanged(vm.grid);
    vm.dataviewService.subscribeToOnRowsChanged(vm.grid);
    vm.gridService.subscribeToOnCellChange();
    vm.gridService.subscribeToOnSort();
    vm.gridService.subscribeToOnBeforeEditCell();
    vm.gridService.subscribeToOnclick();

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

  // TODO : Service for Editor

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
};

PostingJournalController.$inject = ['$translate', '$filter', '$q', 'precision', 'SessionService', 'JournalDataviewService', 'JournalColumnsService', 'JournalGridService', 'JournalDataLoaderService', 'liberror', 'messenger', 'store', 'connect', '$window', 'uuid', '$rootScope', 'util', 'JournalManagerService'];
angular.module('bhima.controllers').controller('PostingJournalController', PostingJournalController);












