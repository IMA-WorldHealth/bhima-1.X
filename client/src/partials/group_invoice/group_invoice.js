angular.module('bhima.controllers')
.controller('groupInvoice', [
  '$scope',
  'connect',
  'validate',
  'appstate',
  'messenger',
  'uuid',
  function ($scope, connect, validate, appstate, messenger, uuid) {

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
            columns : ['uuid', 'name', 'account_id']
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
            columns : ['uuid', 'text']
          },
          'debitor_group' : {
            columns : ['account_id']
          }
        },
        join : ['debitor.group_uuid=debitor_group.uuid']
      }
    };

    // get enterprise
    appstate.register('project', function (project) {
      $scope.project = project;
      dependencies.invoices.query.where =
        ['posting_journal.project_id=' + project.id];
      dependencies.conventions.query.where.push(
        'debitor_group.enterprise_id=' + project.enterprise_id
      );
      validate.process(dependencies, ['debitors', 'conventions']).then(setUpModels);
    });

    $scope.setDebitor = function () {
      if (!$scope.selected.debitor) {
        return messenger.danger('Error: No debitor selected');
      }

      console.log('[selected debitor]', $scope.selected.debitor);
      dependencies.invoices.query += $scope.selected.debitor.uuid;
      validate.process(dependencies).then(setUpModels);
      $scope.hasDebitor = true;
      $scope.action = 'info';
    };

    function setUpModels (models) {
      angular.extend($scope, models);
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
      payment.project_id = $scope.project.id;
      payment.group_uuid = $scope.selected.convention.uuid;
      payment.debitor_uuid  = $scope.selected.debitor.uuid;
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
      var id, items, payment = connect.clean($scope.payment);
      payment.uuid = uuid();
      connect.basicPut('group_invoice', [payment])
      .then(function () {
        id = payment.uuid;
        items = formatItems(id);
        return connect.basicPut('group_invoice_item', items);
      })
      .then(function () {
        $scope.action = '';
        $scope.paying = [];
        return connect.fetch('/journal/group_invoice/' + id);
      })
      .then(function () {
        messenger.success('Data submitted successfully.');
      });
    };

    function formatItems (id) {
      var items = [];
      $scope.paying.forEach(function (i) {
        var item = {};
        item.uuid = uuid();
        item.cost = i.payment;
        item.invoice_uuid = i.inv_po_id;
        item.payment_uuid = id;
        items.push(item);
        console.log('[inserted item]', item);
      });

      return items;

    }

    $scope.filter = function (invoice) {
      return invoice.balance > 0;
    };
  }
]);
