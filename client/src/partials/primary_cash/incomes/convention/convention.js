angular.module('bhima.controllers')
.controller('convention', [
  '$scope',
  '$q',
  '$location',
  '$routeParams',
  'validate',
  'connect',
  'appstate',
  'messenger',
  'util',
  'uuid',
  'appcache',
  function($scope, $q, $location, $routeParams, validate, connect, appstate, messenger, util, uuid, Appcache) {

    var dependencies = {}, record_uuid = -1,
        cache = new Appcache('convention');
    $scope.cashbox_id = $routeParams.cashbox_id;

    dependencies.cash_box = {
      required : true,
      query : {
        tables : {
          'cash_box_account_currency' : {
            columns : ['id', 'currency_id', 'account_id']
          },
          'currency' : {
            columns : ['symbol', 'min_monentary_unit']
          },
          'cash_box' : {
            columns : ['id', 'text', 'project_id']
          }
        },
        join : [
          'cash_box_account_currency.currency_id=currency.id',
          'cash_box_account_currency.cash_box_id=cash_box.id'
        ],
        where : [
          'cash_box_account_currency.cash_box_id=' + $scope.cashbox_id
        ]
      }
    };

    dependencies.exchange_rate = {
      required : true,
      query : {
        tables : {
          'exchange_rate' : {
            columns : ['id', 'enterprise_currency_id', 'foreign_currency_id', 'date', 'rate']
          }
        },
        where : ['exchange_rate.date='+util.convertToMysqlDate(new Date())]
      }
    };

    dependencies.accounts = {
      required : true,
      query : {
        tables : {
          'account' : {
            columns : ['id','account_number', 'account_txt']
          }
        }
      }
    };

    dependencies.cashier = {
      query : 'user_session'
    };

    dependencies.pcash_module = {
      required : true,
      query : {
        tables : {
          'primary_cash_module' : {
            columns : ['id']
          }
        },
        where : ['primary_cash_module.text=convention']
      }
    };

    $scope.noEmpty = false;
    $scope.som = 0;
    $scope.convention = {};
    $scope.data = {};
    $scope.model = {};

    function init (model) {
      $scope.model = model;
    }

    function ready (model) {
      $scope.som = 0;
      $scope.overviews = model.situations.data.filter(function (situation){
        if (situation.balance > 0)  {
          $scope.som += situation.balance;
        }
        return situation.balance>0;
      });
      $scope.noEmpty = true;
    }

    function initialiseConvention (selectedConvention) {
      if(!selectedConvention) {
        return messenger.danger('No convention selected!');
      }
      $scope.selectedConvention = selectedConvention;
      dependencies.situations = { query : '/ledgers/debitor_group/' + $scope.selectedConvention.uuid};
      validate.process(dependencies, ['situations'])
      .then(ready);
    }

    function pay () {

      var record = {
        uuid            : uuid(),
        project_id      : $scope.project.id,
        type            : 'E',
        date            : util.convertToMysqlDate(new Date().toString()),
        currency_id     : $scope.selectedItem.currency_id,
        account_id      : $scope.selectedConvention.account_id,
        cost            : $scope.data.payment,
        user_id         : $scope.model.cashier.data.id,
        description     : ['COVP', $scope.selectedConvention.name, util.convertToMysqlDate(new Date().toString())].join('/'),
        cash_box_id     : $scope.cashbox_id,
        origin_id       : $scope.model.pcash_module.data[0].id
      };

      writePay(record)
      .then(writeItem)
      .then(postToJournal)
      .then(handleSucces);
    }

    function postToJournal (resu) {
      //console.log('[resu]', resu);
      record_uuid = resu[0].config.data.data[0].primary_cash_uuid;
      return connect.fetch('/journal/pcash_convention/' + record_uuid);
    }

    function writePay(record){
      return connect.basicPut('primary_cash', [record]);
    }

    function writeItem (result){
      var pcashItems = getPcashItems($scope.data.payment, result);
      //console.log('[pcashitems]', pcashItems);
      return $q.all(pcashItems.map(function (pcash_item){
        return connect.basicPut('primary_cash_item', [pcash_item]);
      }));
    }

    function getPcashItems(max_amount, result) {
      var items = [];
      var cost_received = max_amount;

      for (var i = 0; i < $scope.overviews.length; i += 1){
        cost_received -= $scope.overviews[i].balance;
        if(cost_received >= 0) {
          items.push({uuid : uuid(), primary_cash_uuid : result.config.data.data[0].uuid, debit : $scope.overviews[i].balance, credit : 0, inv_po_id : $scope.overviews[i].inv_po_id});
        }else{
          cost_received+=$scope.overviews[i].balance;
          items.push({uuid : uuid(), primary_cash_uuid : result.config.data.data[0].uuid, debit : cost_received, credit : 0, inv_po_id : $scope.overviews[i].inv_po_id});
          break;
        }
      }
      return items;
    }

    function setCashAccount(cashAccount) {
      console.log('cashAccount', cashAccount);
      if (cashAccount) {
        $scope.selectedItem = cashAccount;
        cache.put('selectedItem', cashAccount);
      }
    }

    function handleSucces() {
      $scope.selectedConvention = {};
      $scope.data = {};
      $scope.noEmpty = false;
      if (record_uuid !== -1) {
        $location.path('/invoice/pcash_convention/' + record_uuid);
      }
    }


    function load (selectedItem) {
      if (!selectedItem) { return ; }
      $scope.selectedItem = selectedItem;
    }

    cache.fetch('selectedItem').then(load);

    appstate.register('project', function (project) {
      $scope.project = project;
      dependencies.accounts.query.where =
        ['account.enterprise_id=' + project.enterprise_id];
      validate.process(dependencies)
      .then(init);
    });


    function check () {
      if ($scope.data.payment) {
        return $scope.data.payment < $scope.selectedItem.min_monentary_unit || $scope.data.payment > $scope.som;
      }
      return true;
    }

    $scope.initialiseConvention = initialiseConvention;
    $scope.pay = pay;
    $scope.setCashAccount = setCashAccount;
    $scope.check = check;
  }
]);
