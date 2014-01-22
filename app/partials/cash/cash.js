angular.module('kpk.controllers')
.controller('cashController', function($scope, $q, $filter, $timeout, $location, connect, appstate, messenger, validate, exchange) {
  'use strict';

  var imports = {},
      models = $scope.models = {},
      stores = $scope.stores = {},
      data = $scope.data = {};

  imports.enterprise = appstate.get('enterprise');
  imports.dependencies = ['debitors', 'cash', 'currency_account', 'account'];

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

  imports.currency_account = {
    tables : {
      'currency_account' : { columns : ['id', 'enterprise_id', 'currency_id', 'cash_account', 'bank_account']},
      'currency' : { columns : ['symbol'] }
    },
    join : ['currency_account.currency_id=currency.id'],
    where : ['currency_account.enterprise_id=' + imports.enterprise.id]
  };

  imports.accounts = {
    tables : { 'account' : { columns : ['id', 'account_number', 'account_txt']}},
    where : ['account.enterprise_id='+imports.enterprise.id]
  };

  imports.cash = {tables: { "cash" : { columns: ["id", "bon", "bon_num", "date", "debit_account", "credit_account", "currency_id", "cashier_id", "cost", "description"] }}};

  appstate.register('exchange_rate', function (exchange_rate) {
    imports.exchange_rate = exchange_rate;
    $timeout(function () {
      messenger.info('Loaded exchange rate:'+ JSON.stringify(exchange_rate));
      run();
    });
  });

  // TODO/FIXME : abstract this!
  function mysqlDate (date) {
    return (date || new Date()).toISOString().slice(0, 10);
  }

  // paying list
  data.paying = [];
  data.payment = 0;
  data.total = 0;

  function run () {
    $q.all([
      connect.req(imports.debitors),
      connect.req(imports.cash),
      connect.req(imports.currency_account),
      connect.req(imports.accounts)
    ]).then(initialize);
  }

  function initialize (depends) {
    // init all data connections & models
    depends.forEach(function (store, idx) {
      stores[imports.dependencies[idx]] = store;
      models[imports.dependencies[idx]] = store.data;
    });

    if (!imports.exchange_rate) messenger.danger('No Exchange rate data available!');
    var enterprise = imports.enterprise;

    // FIXME : this is bad code..
    $scope.data.box = models.currency_account.filter(function (i) {
      return i.currency_id === enterprise.currency_id;
    }).pop();
  
  }

  $scope.loadDebitor = function (id) {
    $scope.data.paying = [];
    var ref = stores.debitors.get(id);
    data.debitor_id = id;
    $scope.data.debitor = ref.first_name + ' ' + ref.last_name;
    // this loads in a debitors current balance
    connect.fetch('/ledgers/debitor/' + id)
    .then(function (response) {
      if (!response.data) return;
      models.ledger = response.data.map(function (row) {
        // filter only those that do not balance
        var deb = stores.debitors.get(row.deb_cred_id);
        row.debitor = [deb.first_name, deb.last_name].join(' ');
        row.locale = exchange(row.balance, imports.enterprise.currency_id, $scope.data.box.currency_id);
        return row;
      }).filter(function (row) {
        return row.balance > 0;
      });

      messenger.success('Found ' + models.ledger.length + ' record(s) for ' + $scope.data.debitor);
    }, function (error) {
      messenger.danger('Fetching ' + $scope.data.debitor + 'failed with :' + JSON.stringify(error));
    });
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
      total += invoice.locale;
    });
    data.total = total;
  };
  
  $scope.formatTitle = function (box) {
    // FIXME : this is really bad code...
    if (!box) return 'Caisse';
    return stores.account ?  stores.account.get(box.cash_account).account_txt : 'Caisse';
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
        var trial = c - invoice.locale;
        if (trial >= 0) { 
          // more than enough. Allocate it all.
          c = trial;
          invoice.allocated = invoice.locale;
        } else {
          // not quite enough. allocate the rest
          // and set c to zero so all other allocations
          // are zeroed out.
          invoice.allocated = c;
          c = 0;
        }
        // calculate remaining cost
        invoice.remaining = invoice.locale - invoice.allocated;
      });
    } else {
      arr = arr.map(function (invoice) { 
        invoice.allocated = 0;
        return invoice;
      });
    }
   
    // if c is still positive, add it to excess;
    console.log('c is:', c);
    data.excess = c;
  };

  $scope.$watch('data.paying', function () {
    // $scope.digestInvoice();
    $scope.digestTotal();
  }, true);

  $scope.pay = function pay () {
    // FIXME: add a "would you like to credit or pay back" line/check here for excess
    // run digestInvoice once more to stabilize.
    $scope.digestInvoice();
    // gather data

    var bon_num = generateBonNumber(models.cash, 'E');
    var date = mysqlDate(new Date());

    var doc = {
      enterprise_id : imports.enterprise.id,
      bon : 'E', // FIXME: impliment crediting
      bon_num : bon_num,
      date : date,
      debit_account : data.box.cash_account,
      credit_account : stores.debitors.get(data.debitor_id).account_id,
      currency_id : data.box.currency_id,
      cost: data.payment,
      description : 'CP  E/' + bon_num + '/'+data.debitor.replace(' ', '/') + '/' +date, // this is hacky.  Restructure
      cashier_id : 1, // TODO
      cashbox_id : 1,  // TODO,
      deb_cred_id : data.debitor_id,//FIXME: Do it goodly
      deb_cred_type : 'D' //FIXME: Do it goodly
    };

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
      connect.basicPut('cash_item', records)
      .then(function (res) {
        console.log('Fetching journal for doc id', doc.id);

        // posting to the journal
        connect.fetch('/journal/cash/' + doc.id)
        .then(function (res) {
          $location.path('/invoice/cash/' + doc.id);
          
          //Replaced reset with receipt display, this should be decided on
          // $scope.loadDebitor(data.debitor_id);
          // $scope.data.paying = [];
          // $scope.data.payment = 0;
        }, function(err) {
          messenger.danger('Error: ', JSON.stringify(err));
        });
      }, function (err) {
        messenger.danger('Error' + JSON.stringify(error));
      });
    }, function (err) {
      messenger.danger('Cash posting failed with Error: ' + err);
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

  $scope.$watch('data.payment', function () {
    $scope.digestInvoice();
  });


  $scope.$watch('data.box', function () {
    // exchange everything queued to be paid, as well as those in 
    // the list.
    $scope.data.paying.forEach(function (invoice) {
      invoice.locale = exchange(invoice.balance, data.box.currency_id);
    });
    (models.ledger || []).forEach(function (invoice) {
      invoice.locale = exchange(invoice.balance, data.box.currency_id);
    });
  });
 
  run();

});

