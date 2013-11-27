angular.module('kpk.controllers').controller('cashController', function($scope, $q, $modal, $filter, $http, connect, appstate) {
    var imports = {},
      models = $scope.models = {},
      stores = $scope.stores = {},
      data = $scope.data = {};

    imports.cash_account = appstate.get('enterprise').cash_account;
    imports.enterprise_id = appstate.get('enterprise').id;
    imports.model_names = ['debitors', 'currency', 'cash', 'cash_items'];

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

    $q.all([
      connect.req(imports.debitors),
      connect.req(imports.currency),
      connect.req(imports.cash),
      connect.req(imports.cash_items)
    ]).then(initialize);

    var grid, dataview, columns, options;
    var searchInvoice = "";
    var searchDebitor = "";
    var sortcol = "inv_po_id";
    var sortdir = 1;

    // paying list
    data.paying = [];
    data.total = 0;
    data.currency = 1;

    function initialize (dependencies) {
      // init all data connections & models
      dependencies.forEach(function (store, idx) {
        stores[imports.model_names[idx]] = store;
        models[imports.model_names[idx]] = store.data;
      });
      
      columns = [
        {id: 'invoice_id', name: 'Invoice ID', field: 'inv_po_id'},
        {id: 'debitor', name: 'Debitor', field: 'debitor'},
        {id: 'balance', name: 'Balance', field: 'balance', formatter: formatBalance},
        {id: 'date', name: 'Date', field: 'trans_date', formatter: formatDate},
        {id: 'Add', name: '', width: 5, formatter: formatBtn}
      ];

      options = {
        enableCellNavigation: true,
        enableColumnReorder: true,
        forceFitColumns: true,
        rowHeight: 35,
        topBarHeight: 20
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
        var item = grid.getDataItem(args.row);
        if (addInvoice(item)) dataview.deleteItem(item.inv_po_id);
      });

      $('#kpk-cash-filter').appendTo(grid.getTopPanel()).show();

      // intialize everything
      dataview.beginUpdate();
      dataview.setItems(data);
      dataview.setFilterArgs({
        searchInvoice : searchInvoice,
        searchDebitor : searchDebitor 
      });
      dataview.setFilter(filterInvoice);
      dataview.setFilter(filterDebitor);
      dataview.endUpdate();

      dataview.syncGridSelection(grid, true);

      // init data
      loadDebitor('*');

      $scope.$watch('models.ledger', function () {
        if (models.ledger) dataview.setItems(models.ledger, "inv_po_id");
      }, true);

      $scope.$watch('data.invoice', function () {
        if (!data.invoice) data.invoice = ""; // prevent default
        searchInvoice = data.invoice;
        updateFilter();
      });

      $scope.$watch('data.debitor', function () {
        if (!data.debitor) data.debitor = ""; //prevent default
        searchDebitor = data.debitor;
        updateFilter();
      });
    }


    function loadDebitor (id) {
      // populate the outstanding invoices
      $http.get('/ledgers/debitor/' + id)
        .then(function (response) {
          if (response.data) {
            models.ledger = response.data.map(function (row) {
              // filter only those that do not balance
              var cp = row;
              cp.balance = row.credit - row.debit;
              var deb = stores.debitors.get(row.deb_cred_id)
              cp.debitor = [deb.first_name, deb.last_name].join(' ');
              return cp;
            });
          }
        });
    }

    function compareSort(a, b) {
      var x = a[sort_column], y = b[sort_column];
      return (x == y) ? 0 : (x > y ? 1 : -1);
    }
  
    function updateFilter () {
      dataview.setFilterArgs({
        searchInvoice: searchInvoice,
        searchDebitor: searchDebitor
      });
      dataview.refresh();
    }

    function toggleFilterRow () {
      grid.setTopPanelVisibility(!grid.getOptions().showTopPanel);
    };

    function filterInvoice (item, args) {
      if (item.searchInvoice != "" && item["inv_po_id"].indexOf(args.searchInvoice) == -1) {
        return false;
      }
      return true;
    }

    function filterDebitor (item, args) {
      if (item.searchDebitor != "" && item["debitor"].indexOf(args.searchDebitor) == -1) {
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

    function formatBtn (row) {
      return "<span style='width:100%;'<i class='glyphicon glyphicon-plus'></i></span>";
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
      }); 
      return true;
    }

    function removeInvoice (idx) {
      dataview.addItem(data.paying.splice(idx, 1)[0]);
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

    function digestInvoice () {
      var c = (data.payment) ? data.payment : 0;
      var arr = data.paying;
      var index = 0;
      if (!isPositive(arr.length)) return;

      if (isPositive(c)) {
        // this is a loop to allocate the
        // amount in data.payment to each
        // item in the invoice.
        arr = arr.map(function (invoice, idx) {
          var trial = c - invoice.balance;
          index = idx;
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
        });
      }
      // if c is still positive, add it to excess;
      data.excess = c;
    }

    $scope.$watch('data.paying', function () {
      if (isPositive(data.paying.length)) {
        digestTotal();
        var deb = stores.debitors.get(data.paying[0].deb_cred_id);
        // FIXME: all this assumes a patient
        data.debitor = [deb.first_name, deb.last_name].join(' ');
      }
    }, true);

    function pay () { 
      var doc, items;
      // gather data
      doc = {
        id : store.cash.generateid(),
        enterprise_id : imports.enterprise_id,
        bon : 'E', // FIXME: impliment crediting
        bon_num : generateBonNumber(models.cash, 'E'),
        date : $filter('date')(new Date()), // TODO: make this mysql
        debit_account : imports.cash_account,
        credit_account : stores.debitor.get(data.debitor).account_id,
        currency_id : data.currency,
        cost: data.payment,
        cashier_id : 1, // TODO
        cashbox_id : 1  // TODO
      };
  
      // should this API be post().then() to make sure a transaction
      // completes?
      stores.cash.post(doc);

      items = processItems(doc);
      items.forEach(function (item) {
        stores.cash_items.post(item);
      });

      stores.cash.sync();
      stores.cash_items.sync();
    }

    function processItems (ref) {
      var items = [];
      data.payment.forEach(function (invoice) {
        items.push({
          id: stores.cash_items.generateid(),
          cash_id : ref.id,
          allocated_cost : invoice.allocated,
          invoice_id : invoice.inv_po_id
        });
      });
      return items;
    }

    function formatCurrency (id) {
      // deal the the asynchronous case where store is not
      // defined.
      return (stores.currency && stores.currency.get(id)) ? stores.currency.get(id).symbol: "";
    };

    function setCurrency (idx) {
      // store indexing starts from 0.  DB ids start from 1
      slip.currency_id = idx + 1; 
    };

    function getBonNumber (model, bon_type) {
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
    $scope.toggleFilterRow = toggleFilterRow;
    $scope.removeInvoice = removeInvoice;
    $scope.digestInvoice = digestInvoice;
  });
