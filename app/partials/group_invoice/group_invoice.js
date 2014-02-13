angular.module('kpk.controllers')
.controller('groupInvoice', [
  '$scope',
  '$routeParams',
  'connect',
  'validate',
  'appstate',
  'messenger',
  function ($scope, $routeParams, connect, validate, appstate, messenger) {
    'use strict';

    var dependencies = {};
    $scope.action = '';
    $scope.convention = '';
    $scope.selected = {};
    $scope.paying = [];


    dependencies.invoices = {
      query : 'ledgers/debitor/'
    };

    dependencies.conventions = {
      required: true,
      query : {
        tables : {
          'debitor_group'  : {
            columns : ['id', 'name', 'account_id']
          }
        },
        where : ['debitor_group.is_convention<>0', 'AND']
      }
    };

    dependencies.debitors = {
      required : true,
      query : {
        tables : {
          'debitor' : {
            columns : ['id', 'text']
          },
          'debitor_group' : {
            columns : ['account_id']
          }
        },
        join : ['debitor.group_id=debitor_group.id']
      }
    };

    // get enterprise
    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      dependencies.invoices.query.where =
        ['posting_journal.enterprise_id=' + enterprise.id];
      dependencies.conventions.query.where.push(
        'debitor_group.enterprise_id=' + enterprise.id
      );
      validate.process(dependencies, ['debitors', 'conventions']).then(setUpModels);
    });

    $scope.setDebitor = function () {
      if (!$scope.selected.debitor) {
        return messenger.danger('Error: No debitor selected');
      }
      dependencies.invoices.query += $scope.selected.debitor.id;
      validate.process(dependencies).then(setUpModels);
      $scope.hasDebitor = true;
      $scope.action = 'info';
    };

    function setUpModels (models) {
      for (var k in models) { $scope[k] = models[k]; }
      if ($scope.invoices) {
        // FIXME: this is hack
        $scope.invoices.data = $scope.invoices.data.filter(function (d) {
          return d.balance !== 0;
        });
      }
      $scope.payment = {};
    }

    $scope.examineInvoice = function (invoice) {
      $scope.examine = invoice;
      $scope.old_action = $scope.action;
      $scope.action = 'examine';
    };

    $scope.back = function () {
      $scope.action = $scope.old_action;
    };

    $scope.selectConvention = function () {
      $scope.action = 'selectConvention';
      $scope.original_id = $scope.data.invoice.convention_id;
    };

    $scope.saveConvention = function () {
      $scope.action = '';
    };

    $scope.resetConvention = function () {
      $scope.data.invoice.convention_id = $scope.original_id;
      $scope.action = 'default';
    };

    $scope.enqueue = function (idx) {
      var invoice = $scope.invoices.data.splice(idx, 1)[0];
      invoice.payment = invoice.balance; // initialize payment to be the exact amount -- 100%
      $scope.paying.push(invoice);
      $scope.action = 'pay';
    };

    $scope.dequeue = function () {
      $scope.paying.forEach(function (i) {
        $scope.invoices.data.push(i);
      });
      $scope.paying.length = 0;
      $scope.action = '';
    };

    $scope.pay = function () {
      var payment = $scope.payment;
      payment.enterprise_id = $scope.enterprise.id;
      payment.group_id = $scope.selected.convention.id;
      payment.debitor_id  = $scope.selected.debitor.id;
      payment.total = $scope.paymentBalance;
      payment.date = new Date().toISOString().slice(0,10);
      $scope.action = 'confirm';
    };

    $scope.$watch('paying', function () {
      var s = 0;
      $scope.paying.forEach(function (i) {
        s = s + i.payment;
      });
      $scope.paymentBalance = s;
    }, true);

    $scope.authorize = function () {
      var payment = connect.clean($scope.payment);
      connect.basicPut('group_invoice', [payment])
      .then(function (res) {
        var id = res.data.insertId;
        var items = formatItems(id);
        connect.basicPut('group_invoice_item', [items])
        .then(function (res) {
          $scope.action = '';
          $scope.paying = [];
          connect.fetch('/journal/group_invoice/' + id)
          .then(function () {
            messenger.success('Data submitted successfully.');
          });
        }, function (err) {
          messenger.danger(JSON.stringify(err));
        });
      }, function (err) {
        messenger.danger(JSON.stringify(err));
      });
    };

    function formatItems (id) {
      var items = [];
      $scope.paying.forEach(function (i) {
        var item = {};
        item.cost = i.payment;
        item.invoice_id = i.inv_po_id;
        item.payment_id = id;
        items.push(item);
      });
     
      return items;
     
    }

    $scope.filter = function (invoice) {
      return invoice.balance > 0;
    };
  }
]);
