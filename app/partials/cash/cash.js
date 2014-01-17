angular.module('kpk.controllers')
.controller('cashController', function($scope, $q, $filter, $http, $timeout, connect, appstate, messenger) {
  'use strict';

  var imports = {},
      models = $scope.models = {},
      stores = $scope.stores = {},
      data = $scope.data = {};

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


  appstate.register('exchange_rate', function (exchange_rate) {
    imports.exchange_rate = exchange_rate;
    $timeout(function () {
      messenger.info('Loaded exchange rate:'+ JSON.stringify(exchange_rate));
      run();
    });
  });

  // TODO/FIXME : abstract this!
  function mysqlDate (date) {
    return (date || new Date()).toISOString().slice(0, 10).replace('T', ' ');
  }

  // paying list
  data.paying = [];
  data.payment = 0;
  data.total = 0;
  data.currency = imports.enterprise.currency_id;

  function run () {
    $q.all([
      connect.req(imports.debitors),
      connect.req(imports.currency),
      connect.req(imports.cash),
      connect.req(imports.cash_items),
     // connect.req(imports.exchange_rate)
    ]).then(initialize);
  }

  function initialize (depends) {
    // init all data connections & models
    depends.forEach(function (store, idx) {
      stores[imports.dependencies[idx]] = store;
      models[imports.dependencies[idx]] = store.data;
    });

    if (!imports.exchange_rate) messenger.danger('No Exchange rate data available!');
  }

  $scope.loadDebitor = function (id) {
    // this loads in a debitors current balance
    $http.get('/ledgers/debitor/' + id)
      .then(function (response) {
        messenger.success('The data for debitor ' +id+' loaded successfully');
        if (!response.data) return;
        models.ledger = response.data.map(function (row) {
          // filter only those that do not balance
          var deb = stores.debitors.get(row.deb_cred_id);
          row.debitor = [deb.first_name, deb.last_name].join(' ');
          return row;
        }).filter(function (row) {
          return row.balance > 0;
        });
      }, function (error) {
        messenger.danger('Fetching debitors failed with :' + JSON.stringify(error));
      });
    data.debitor_id = id;
  };

  $scope.currency = function (id) {
    return stores.currency ? stores.currency.get(id).symbol : '';
  };

  $scope.add = function (idx) {
    var invoice = models.ledger.splice(idx, 1)[0];
    invoice.allocated = 0;
    data.paying.push(invoice);
    $scope.digestInvoice();
  };

  $scope.remove = function (idx) {
    models.ledger.push(data.paying.splice(idx, 1)[0]);
    $scope.digestInvoice();
  };

  $scope.digestTotal = function () {
    var total = 0;
    data.paying.forEach(function (invoice) {
      total += invoice.balance;
    });
    data.total = total;
  };

  function isPositive (x) {
    return x >= 0; 
  }

  $scope.digestInvoice = function () {
    var c = (data.payment) ? data.payment : 0;
    var arr = data.paying;

    if (!isPositive(arr.length)) data.excess = c;

    if (isPositive(c)) {
      // this is a loop to allocate the
      // amount in data.payment to each
      // item in the invoice.
      arr = arr.map(function (invoice, idx) {
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
        invoice.allocated = 0;
        return invoice;
      });
    }
   
    // if c is still positive, add it to excess;
    data.excess = c;
  };

  $scope.$watch('data.paying', function () {
    $scope.digestInvoice();
    $scope.digestTotal();
  }, true);

  /*
  $scope.$watch('data.paying', function () {
    if (isPositive(data.paying.length)) {
      digestTotal();
      var deb = stores.debitors.get(data.paying[0].deb_cred_id);
      // FIXME: all this assumes a patient, debitors don't have first_names and last_names
      data.debitor = [deb.first_name, deb.last_name].join(' ');
      data.debitor_id = deb.id;
    }
  }, true);
  */

  $scope.pay = function pay () {
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

    console.log('Document : ', doc);

    connect.basicPut('cash', [doc])
    .then(function (res) {
      doc.id = res.data.insertId;
      return res;
    })
    .then(function (res) {
      var records = [],
        invoices = data.paying;

      // FIXME: raw hacks!
      invoices.forEach(function (invoice) {
        if (invoice.allocated === 0) return;
        var record = {
          cash_id : doc.id,
          allocated_cost : invoice.allocated,
          invoice_id : invoice.inv_po_id
        };
        records.push(record);
      });

      // putting cash items
      $q.all(
        records.map(function (record) {
          return connect.basicPut('cash_item', [record]);
        })
      )
      .then(function (res) {
        console.log('RES is:', res);
        console.log('Fetching journal for doc id', doc.id);

        // posting to the journal
        connect.fetch('/journal/cash/' + doc.id)
        .then(function (res) {
          $scope.loadDebitor(data.debitor_id);
          $scope.data.paying = [];
          $scope.payment = 0;
        }, function(err) {
          messenger.danger('Error: ', JSON.stringify(err));
        });
      }, function (err) {
        messenger.danger('Error' + JSON.stringify(error));
      });
    }, function (err) {
      messenger.danger('Cash posting failed with Error: ' + error);
    });
    
  };

  function generateBonNumber (model, bon_type) {
    // filter by bon type, then gather ids.
    var ids = model.filter(function(row) {
      return row.bon === bon_type; 
    }).map(function(row) {
      return row.bon_num;
    });
    return (ids.length < 1) ? 1 : Math.max.apply(Math.max, ids) + 1;
  }

  $scope.$watch('data.currency', function (current, old) {
    if (!imports.exchange_rate) return;

    var rate = imports.exchange_rate.rate;
    $scope.data.paying = data.paying.map(function (invoice) {
      invoice.balance = old === imports.enterprise.currency_id ? rate * invoice.balance : (1/rate) * invoice.balance;
      invoice.allocated = old === imports.enterprise.currency_id ? rate * invoice.allocated : (1/rate) * invoice.allocated;
      return invoice;
    });

    $scope.digestInvoice();
    $scope.digestTotal();

  });

  $scope.$watch('data.payment', function () {
    $scope.digestInvoice();
  });


 
  run();

});

