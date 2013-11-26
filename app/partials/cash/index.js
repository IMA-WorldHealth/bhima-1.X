angular.module('kpk.controllers').controller('cashController', function($scope, connect, $q, $filter, $http, appstate) {
    var enterprise, debitors, cash_items, cash,
        currency, enterprise_id, cash_account;
    cash_account = appstate.get('enterprise').cash_account;
    enterprise_id = appstate.get('enterprise').id;

    debitors = {
      tables: {
        'patient' : {columns: ["first_name", "last_name"]},
        'debitor' : {columns: ["id"]},
        'debitor_group' : {columns: ['name', 'account_number', 'max_credit']}
      },
      join: ['patient.debitor_id=debitor.id', 'debitor.group_id=debitor_group.id'],
      where: ['debitor_group.locked<>1']
    };

    currency = {
      tables : { "currency" : { columns: ["id", "symbol"] } } 
    };

    cash = {
      tables: { "cash" : { columns: ["id", "bon", "bon_num", "invoice_id", "date", "debit_account", "credit_account", "currency_id", "cashier_id", "text"] }},
    };

    cash_items = {
      tables: { 'cash_item' : { columns: ["id", "cash_id", "invoice_id", "cost"] }}, 
    };

    $q.all([
      connect.req(debitors),
      connect.req(currency),
      connect.req(cash),
      connect.req(cash_items)
    ]).then(init);

    var model_names = ['debitors', 'currency', 'cash', 'cash_items'];
    var models = $scope.models = {};
    var stores = $scope.stores = {};
    var slip = $scope.slip = {};
    var meta = $scope.meta = {};
    meta.invoices = [];

    function init (arr) {
      // init all data connections & models
      arr.forEach(function (model, idx) {
        stores[model_names[idx]] = model;
        models[model_names[idx]] = model.data;
      });
    }

    function defaults () {
      slip.id = stores.cash.generateid();

      // Module-dependent flag to say what cashbox this is
      slip.cashbox_id = 1;

      //just for the test, it will be changed
      slip.enterprise_id = enterprise_id;

      // default debit account is cash box
      slip.debit_account = cash_account;

      // default date is today
      slip.date = $filter('date')(new Date(), 'yyyy-MM-dd');

      // default currency
      slip.currency_id = 1;

      // we start up as entree
      slip.bon = "E";

      slip.bon_num = getBonNumber(models.cash, slip.bon);

      // FIXME: get this from a service
      slip.cashier_id = 1;

    }


    function selectDebitor () {
      // populate the outstanding invoices
      $http.get('/ledgers/debitor/' + meta.debitor)
        .then(function (response) {
          if (response.data) {
            models.outstanding = response.data.filter(function (row) {
              // filter only those that do not balance
              return (row.credit - row.debit > 0); 
            });
          }
        });

      slip.credit_account = stores.debitors.get(meta.debitor).account_number;
      // update the text automatically
      // This doesn't work yet.
      $scope.$watch([meta.invoices, meta.debitors, meta.amount], function () {
        // default text
        slip.text = "Payment of invoice(s) %s for patient %p totaling %a."
            .replace('%s', meta.invoices.join().toUpperCase())
            .replace('%p', stores.debitors.get(meta.debitor).first_name.toUpperCase())
            .replace('%a', meta.amount || '');
      })
      defaults();
    }

    $scope.selectDebitor = selectDebitor;

    $scope.formatCurrency = function (id) {
      // deal the the asynchronous case where store is not
      // defined.
      return (stores.currency && stores.currency.get(id)) ? stores.currency.get(id).symbol: "";
    };

    $scope.setCurrency = function (idx) {
      // store indexing starts from 0.  DB ids start from 1
      slip.currency_id = idx + 1; 
    };

    $scope.formatName = function (deb) {
      return [deb.first_name, deb.last_name].join(' ');
    };

    function createCashItems (cost) {
      var item, debt, i = 0,
          model = meta.invoices,
          store = stores.cash_items;
      while (cost > 0 && model[i]) {
        debt = model[i].credit - model[i].credit;
        item = {};
        item.id = store.generateid();
        item.cash_id = slip.id;
        item.invoice_id = model[i].id;
        item.cost = (cost - debt >= 0) ? cost - debt : debt - cost;
        cost = cost - item.cost;
        store.post(item);
        console.log("created:", item);
        i++;
      }
    }

    $scope.submit = function () {
      // clean off the object of $hashkey and the like
      var cleaned = connect.clean(slip);
      if (meta.invoices.length < 1) { 
        $scope.noinvoices = true;
        return; 
      } else {
        createCashItems(meta.amount);
        stores.cash.put(cleaned); 
      }
      // FIXME: improve this
      connect.journal([{id:slip.id, transaction_type:1, user:1}]); //a effacer just for the test
      // FIXME: make this formal for posting to the journal
      $scope.clear();
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

    $scope.valid = function () {
      var receipt = $scope.receipt;
      var bool = receipt.bon_num.$valid && receipt.amount.$valid && !!slip.credit_account;
      return bool; 
    };

    $scope.clear = function () {
      slip = $scope.slip = {};
      defaults();
    };

  });