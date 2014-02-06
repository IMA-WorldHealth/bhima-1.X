angular.module('kpk.controllers')
.controller('cashController', [
  '$scope',
  '$q',
  '$filter',
  '$timeout',
  '$location',
  'connect',
  'appstate',
  'messenger',
  'validate',
  'exchange',
  function($scope, $q, $filter, $timeout, $location, connect, appstate, messenger, validate, exchange) {
    'use strict';

    var dependencies = {};

    // NOTE: This assumes that all debitor transactions
    // are made with patients.  This should change in all
    // generality.
    dependencies.debitors = {
      query : {
        tables: {
          'patient' : {
            columns: ['first_name', 'last_name']
          },
          'debitor' : {
            columns: ['id']
          },
          'debitor_group' : {
            columns: ['name', 'account_id', 'max_credit']
          },
          'account' : {
            columns: ['account_number']
          }
        },
        join: [
          'patient.debitor_id=debitor.id',
          'debitor.group_id=debitor_group.id',
          'debitor_group.account_id=account.id'
        ],
        where: ['debitor_group.locked<>1']
      }
    };

    dependencies.cashboxes = {
      query : {
        tables : {
          'currency_account' : { columns : ['id', 'enterprise_id', 'currency_id', 'cash_account', 'bank_account']},
          'currency' : { columns : ['symbol'] }
        },
        join : ['currency_account.currency_id=currency.id'],
      }
    };

    dependencies.accounts = {
      query : {
        tables : {
          'account' : {
            columns : ['id', 'account_number', 'account_txt']
          }
        },
      }
    };

    dependencies.cash = {
      query : {
        tables: {
          'cash' : {
            columns: ['id', 'bon', 'bon_num', 'date', 'debit_account', 'credit_account', 'currency_id', 'cashier_id', 'cost', 'description']
          }
        }
      }
    };

    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      dependencies.cashboxes.query.where =
        ['currency_account.enterprise_id=' + enterprise.id];
      dependencies.accounts.query.where =
        ['account.enterprise_id=' + enterprise.id];
      validate.process(dependencies).then(setUpModels, handleErrors);
    });

    function setUpModels(models) {
      for (var k in models) { $scope[k] = models[k]; }
    }

    function handleErrors(error) {
      messenger.danger('Error:', JSON.stringify(error));
    }

    $scope.loadInvoices = function (debitor) {
      $scope.debitor = debitor;
      $scope.paying = [];
      connect.fetch('/ledgers/debitor/' + debitor.id)
      .then(function (res) {
        $scope.ledger= res.data.map(function (row) {
          // filter only those that do not balance
          row.debitor = [debitor.first_name, debitor.last_name].join(' ');
          row.locale = exchange(row.balance, $scope.enterprise.currency_id, $scope.data.box.currency_id);
          return row;
        }).filter(function (row) {
          return row.balance > 0;
        });
      }, function (err) {
        messenger.danger('An error occured:' + JSON.stringify(err));
      });
    };

    // TODO/FIXME : abstract this!
    function mysqlDate (date) {
      return (date || new Date()).toISOString().slice(0, 10);
    }

    var data = $scope.data = {};
    // paying list
    data.paying = [];
    data.payment = 0;
    data.total = 0;

    $scope.add = function (idx) {
      var invoice = $scope.ledger.splice(idx, 1)[0];
      invoice.allocated = 0;
      data.paying.push(invoice);
      $scope.digestInvoice();
    };

    $scope.remove = function (idx) {
      $scope.ledger.push(data.paying.splice(idx, 1)[0]);
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
      return $scope.accounts ?
        $scope.account.get(box.cash_account).account_txt :
        'Caisse';
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
      // FIXME: add a 'would you like to credit or pay back' line/check here for excess
      // run digestInvoice once more to stabilize.
      $scope.digestInvoice();
      // gather data

      var bon_num = generateBonNumber($scope.cash.data, 'E');
      var date = mysqlDate(new Date());

      var doc = {
        enterprise_id : $scope.enterprise.id,
        bon : 'E', // FIXME: impliment crediting
        bon_num : bon_num,
        date : date,
        debit_account : data.box.cash_account,
        credit_account : $scope.debitors.get(data.debitor_id).account_id,
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

      ($scope.ledger || []).forEach(function (invoice) {
        invoice.locale = exchange(invoice.balance, data.box.currency_id);
      });
    });
   
  }
]);

