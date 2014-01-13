angular.module('kpk.controllers')
.controller('cashController', function($scope, $q, $filter, $http, connect, appstate, messenger) {
  'use strict';

  var imports = {},
      models = $scope.models = {},
      stores = $scope.stores = {},
      data = $scope.data = {},
      TRANSACTION_TYPE = 1;

  imports.enterprise = appstate.get('enterprise');
  imports.dependencies = ['debitors', 'currency', 'cash', 'cash_items', 'exchange_rate'];

  imports.debitors = {
    tables: {
      'patient' : {columns: ["first_name", "last_name"]},
      'debitor' : {columns: ["id"]},
      'debitor_group' : {columns: ['name', 'account_id', 'max_credit']},
      'account' : {columns: ['account_number']}
    },
    join: ['patient.debitor_id=debitor.id', 'debitor.group_id=debitor_group.id', 'debitor_group.account_id=account.id'],
    where: ['debitor_group.locked<>1']
  };

  imports.currency = {tables : { "currency" : { columns: ["id", "symbol"] }}};
  imports.cash = {tables: { "cash" : { columns: ["id", "bon", "bon_num", "date", "debit_account", "credit_account", "currency_id", "cashier_id", "cost", "text"] }}};
  imports.cash_items = {tables: { 'cash_item' : { columns: ["id", "cash_id", "allocated_cost", "invoice_id"] }}};

  imports.exchange_rate = {
    tables : { 'exchange_rate' : { columns : ['id', 'enterprise_currency_id', 'foreign_currency_id', 'rate', 'date']}},
    where : ['exchange_rate.date='+ mysqlDate()]
  };

  // TODO/FIXME : abstract this!
  function mysqlDate (date) {
    return (date || new Date()).toISOString().slice(0, 10).replace('T', ' ');
  }


  $q.all([
    connect.req(imports.debitors),
    connect.req(imports.currency),
    connect.req(imports.cash),
    connect.req(imports.cash_items),
    connect.req(imports.exchange_rate)
  ]).then(initialize);

  var grid, dataview, columns, options;
  var search = "";
  var sortcol = "inv_po_id";

  // paying list
  data.paying = [];
  data.payment = 0;
  data.total = 0;
  data.currency = imports.enterprise.currency_id;

  function initialize (depends) {
    // init all data connections & models
    depends.forEach(function (store, idx) {
      stores[imports.dependencies[idx]] = store;
      models[imports.dependencies[idx]] = store.data;
    });

    columns = [
      {id: 'invoice_id', name: 'Invoice ID', field: 'inv_po_id'},
      {id: 'debitor', name: 'Debitor', field: 'debitor'},
      {id: 'balance', name: 'Balance', field: 'balance', formatter: formatBalance},
      {id: 'date', name: 'Date', field: 'trans_date', formatter: formatDate}
    ];

    options = {
      enableCellNavigation: true,
      enableColumnReorder: true,
      forceFitColumns: true,
      rowHeight: 35,
      topBarHeight: 25
    };

    dataview = new Slick.Data.DataView({inlineFilters: true});

    dataview.onRowCountChanged.subscribe(function (e, args) {
      grid.updateRowCount();
      grid.render();
    });

    dataview.onRowsChanged.subscribe(function (e, args) {
      grid.invalidateRows(args.rows);
      grid.render();
    });

    grid = new Slick.Grid('#kpk-cash-grid', dataview, columns, options);
    grid.setSelectionModel(new Slick.RowSelectionModel());

    grid.onSort.subscribe(function(e, args) {
      sort_column = args.sortCol.field;
      dataview.sort(compareSort, args.sortAsc);
    });

    grid.onClick.subscribe(function (e, args) {
      // FIXME: this should only work on the plus sign
      var item = grid.getDataItem(args.row);
      if (addInvoice(item)) dataview.deleteItem(item.inv_po_id);
    });

    // intialize everything
    dataview.beginUpdate();
    dataview.setItems(data);
    dataview.setFilterArgs({
      search: search
    });
    dataview.setFilter(filter);
    dataview.endUpdate();

    dataview.syncGridSelection(grid, true);

    $scope.$watch('models.ledger', function () {
      data.search = '';
      if (models.ledger) dataview.setItems(models.ledger, "inv_po_id");
    }, true);

    $scope.$watch('data.search', function () {
      if (!data.search) data.search = ""; //prevent default
      search = data.search;
      updateFilter();
    });
  }

  function loadDebitor (id) {
    // this currently fires with id = '*' to load
    // all outstanding debitors.  This can be
    // adjusted for security as needed.
    // populate the outstanding invoices
    $http.get('/ledgers/debitor/' + id)
      .then(function (response) {
        messenger.success('The data for debitor ' +id+' loaded successfully');
        if (!response.data) return;
        models.ledger = response.data.map(function (row) {
          // filter only those that do not balance
          var cp = row;
          cp.balance = row.debit - row.credit; // TODO: verify that this is correct
          var deb = stores.debitors.get(row.deb_cred_id);
          cp.debitor = [deb.first_name, deb.last_name].join(' ');
          return cp;
        }).filter(function (row) {
          return row.balance > 0;
        });
      }, function (error) {
        messenger.danger('Fetching debitors failed with :' + JSON.stringify(error));
      });
      data.debitor_id = id;
  }

  function compareSort(a, b) {
    var x = a[sort_column], y = b[sort_column];
    return (x == y) ? 0 : (x > y ? 1 : -1);
  }
  
  function updateFilter () {
    dataview.setFilterArgs({
      search: search 
    });
    dataview.refresh();
  }

  function filter (item, args) {
    // FIXME : For some reason, there is a chance an item does not have a invoice
    // or puchase order id.  The hack below fixes this, but we should investigate. 
    if (item.search !== "" && (item.inv_po_id || '').indexOf(args.search) === -1 && item.debitor.indexOf(args.search) === -1) {
      return false;
    }
    return true;
  }

  function formatBalance (row, cell, value) {
    return $filter('currency')(value);
  }

  function formatDate (row, cell, value) {
    return $filter('date')(value); 
  }

  function addInvoice (item) {
    // should this reset the filter such that all
    // items are filtered on the debitor?
    // It currently does.
    var bool = data.paying.every(function (row) {
      return item.deb_cred_id === row.deb_cred_id;
    });
    return (bool) ? selectInvoice(item) : false;
  }

  function selectInvoice (invoice) {
    $scope.$apply(function () {
      invoice.allocated = 0.00;
      invoice.remaining = invoice.balance;
      data.paying.push(invoice);
      $scope.digestInvoice();
    }); 
    return true;
  }

  function removeInvoice (idx) {
    dataview.addItem(data.paying.splice(idx, 1)[0]);
    $scope.digestInvoice();
  }

  function digestTotal () {
    var total = 0;
    data.paying.forEach(function (invoice) {
      total += invoice.balance;
    });
    data.total = total;
  }

  $scope.$watch('data.payment', function () {
    $scope.digestInvoice();
  });

  function isPositive (x) {
    return x > 0; 
  }

  function freeze (invoice) {
    invoice.frozen = true;
    $scope.digestInvoice();
  }
  
  function thaw (invoice) {
    invoice.frozen = false;
    $scope.digestInvoice(); // reset frozentotal
  }

  function digestInvoice () {
    var c = (data.payment) ? data.payment : 0;
    var arr = data.paying,
        frozentotal = 0;

    if (!isPositive(arr.length)) data.excess = c;

    // calculate frozen totals
    arr.forEach(function (invoice) {
      if (invoice.frozen) {
        frozentotal += invoice.allocated;
        var remaining = invoice.balance - invoice.allocated;
        invoice.remaining = remaining > 0 ? remaining : 0;
      }
    });
    
    // frozen values take precedence
    c = c - frozentotal;

    if (isPositive(c)) {
      // this is a loop to allocate the
      // amount in data.payment to each
      // item in the invoice.
      arr = arr.map(function (invoice, idx) {
        if (invoice.frozen) return invoice; // escape frozen vlaues
        var trial = c - invoice.balance;
        if (trial >= 0) { 
          // more than enough. Allocate it all.
          c = trial;
          invoice.allocated = invoice.balance;
        } else {
          // not quite enough. allocate the rest
          // and set c to zero so all other allocations
          // are zeroed out.
          invoice.allocated = c;
          c = 0;
        }
        // calculate remaining cost
        invoice.remaining = invoice.balance - invoice.allocated;
      });
    } else {
      arr = arr.map(function (invoice) { 
        if (invoice.frozen) return invoice;
        invoice.allocated = 0;
        return invoice;
      });
    }
   
    // if c is still positive, add it to excess;
    data.excess = c;
  }

  $scope.$watch('data.paying', function () {
    if (isPositive(data.paying.length)) {
      digestTotal();
      var deb = stores.debitors.get(data.paying[0].deb_cred_id);
      // FIXME: all this assumes a patient, debitors don't have first_names and last_names
      data.debitor = [deb.first_name, deb.last_name].join(' ');
      data.debitor_id = deb.id;
    }
  }, true);

  function journalPost (id) {
    var d = $q.defer();
    connect.fetch('/journal/cash/' + id)
    .then(function (res) {
      messenger.success('Posted to journal');
      d.resolve(res);
    }, function (error) {
      messenger.danger('Error: ' + JSON.stringify(error));
      d.reject(error);
    });
    return d.promise;
  }

  function pay () {
    // FIXME: add a "would you like to credit or pay back" line/check here for excess
    // run digestInvoice once more to stabilize.
    $scope.digestInvoice();
    // gather data
    var doc = {
      enterprise_id : imports.enterprise.id,
      bon : 'E', // FIXME: impliment crediting
      bon_num : generateBonNumber(models.cash, 'E'),
      date : mysqlDate(new Date()),
      debit_account : imports.enterprise.cash_account,
      credit_account : stores.debitors.get(data.debitor_id).account_id,
      currency_id : data.currency,
      cost: data.payment,
      cashier_id : 1, // TODO
      cashbox_id : 1,  // TODO,
      deb_cred_id : data.debitor_id,//FIXME: Do it goodly
      deb_cred_type : 'D' //FIXME: Do it goodly
    };

    // should this API be post().then() to make sure a transaction
    // completes?
    // stores.cash.post(doc);
    connect.basicPut('cash', [doc])
    .then(function (res) {
      if (res.status != 200) return;
      doc.id = res.data.insertId;
      var items = processItems(doc);
      var promise = $q.all(items.map(function (item) { return connect.basicPut('cash_item', [item]); }));
      promise.then(function (res) { 
        messenger.success('Invoice successfully paid.');
      }, function (error) {
        messenger.danger('Error ' + JSON.stringify(error));
      });
    })
    .then(function () {
      connect.basicGet("user_session")
      .then(function (res) {
        journalPost(doc.id, res.data.id)
        .then(function (response) {
          loadDebitor(data.debitor_id);
          $scope.data.paying = [];
        });
      });
    });
    
  }

  function processItems (ref) {
    var items = [];
    // FIXME: raw hacks!
    console.log('DATA.PAYING', data.paying);
    data.paying.forEach(function (invoice) {
      if (invoice.allocated > 0) {
        items.push({
          cash_id : ref.id,
          allocated_cost : invoice.allocated,
          invoice_id : invoice.inv_po_id
        });
      }
    });
    return items;
  }

  function formatCurrency (id) {
    // deal the the asynchronous case where store is not
    // defined.
    return (stores.currency && stores.currency.get(id)) ? stores.currency.get(id).symbol: "";
  }

  function setCurrency (idx) {
    // store indexing starts from 0.  DB ids start from 1
    slip.currency_id = idx + 1; 
  }

  function generateBonNumber (model, bon_type) {
    // filter by bon type, then gather ids.
    var ids = model.filter(function(row) {
      return row.bon === bon_type; 
    }).map(function(row) {
      return row.bon_num;
    });
    return (ids.length < 1) ? 1 : Math.max.apply(Math.max, ids) + 1;
  }

  $scope.setCurrency = setCurrency;
  $scope.formatCurrency = formatCurrency;
  $scope.removeInvoice = removeInvoice;
  $scope.digestInvoice = digestInvoice;
  $scope.pay = pay;
  $scope.freeze = freeze;
  $scope.thaw = thaw;
  $scope.loadDebitor = loadDebitor;
  
});
