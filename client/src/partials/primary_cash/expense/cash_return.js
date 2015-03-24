angular.module('bhima.controllers')
.controller('cashReturn', [
  '$scope',
  '$routeParams',
  '$translate',
  'messenger',
  'validate',
  'appstate',
  'appcache',
  'connect',
  'util',
  'exchange',
  '$q',
  'uuid',
  function ($scope, $routeParams, $translate, messenger, validate, appstate, Appcache, connect, util, exchange, $q, uuid) {
    var dependencies = {},
        cache = new Appcache('cash_return'),
        session = $scope.session = {data : {}, base : {}};

    session.base.cashbox = $routeParams.cashbox;

    dependencies.cashier = {
      query : 'user_session'
    };

    dependencies.modules = {
      query : {
        tables : {
          'primary_cash_module' : {
            columns : ['id']
          }
        },
        where : ['primary_cash_module.text=cash_return']
      }
    };

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
          'cash_box_account_currency.cash_box_id=' + session.base.cashbox
        ]
      }
    };

    dependencies.debtors = {
      query: {
        identifier : 'uuid',
        'tables' : {
          'debitor' : { 'columns' : ['uuid', 'text'] },
          'patient' : { 'columns' : ['first_name', 'last_name'] },
          'debitor_group' : { 'columns' : ['name'] },
          'account' : { 'columns' : ['account_number', 'id'] }
        },
        join: ['debitor.uuid=patient.debitor_uuid', 'debitor_group.uuid=debitor.group_uuid', 'debitor_group.account_id=account.id']
      }
    };

    dependencies.creditors = {
      query: {
        'tables' : {
          'creditor' : { 'columns' : ['uuid', 'text'] },
          'creditor_group' : { 'columns' : ['name'] },
          'account' : { 'columns' : ['account_number', 'id'] }
        },
        join: ['creditor.group_uuid=creditor_group.uuid','creditor_group.account_id=account.id']
      }
    };

    cache.fetch('type').then(defineType);
    cache.fetch('selectedItem').then(load);

    appstate.register('project', function (project) {
      session.base.project = project;
      validate.process(dependencies)
      .then(init);
    });

    function init (models) {
      var entities = models.entities = [];
      models.debtors.data.forEach(function (debtor) {
        debtor.type = 'd';
        entities.push(debtor);
      });

      models.creditors.data.forEach(function (creditor) {
        creditor.type = 'c';
        entities.push(creditor);
      });

      angular.extend($scope, models);
    }

    function setCashAccount(cashAccount) {
      if (cashAccount) {
        session.base.selectedItem = cashAccount;
        cache.put('selectedItem', cashAccount);
      }
    }

    function defineType (type){
      if (!type) { return ; }
      session.data.type = type;
    }

    function load (selectedItem) {
      if (!selectedItem) { return ; }
      session.base.selectedItem = selectedItem;
    }

    function valid (){
      return session.data.deb_cred && session.data.value;
    }

    function submit (){
      console.log('data', session.data);
      console.log('base', session.base);
      console.log('scope', $scope);

      var primary_cash = {
        uuid : uuid(),
        project_id : session.base.project.id,
        type : 'S',
        date : util.sqlDate(new Date()),
        deb_cred_uuid : session.data.deb_cred.uuid,
        deb_cred_type : session.data.type,
        currency_id : session.base.selectedItem.currency_id,
        account_id : session.data.deb_cred.id,
        cost : session.data.value,
        user_id : $scope.cashier.data.id,
        description : [session.base.project.abbr, 'RETOUR_CAISSE', session.data.deb_cred.text, session.data.type, util.sqlDate(new Date())].join('/'),
        cash_box_id : session.base.cashbox,
        origin_id : $scope.modules.data[0].id
      };

      var primary_cash_item = {
        uuid : uuid(),
        primary_cash_uuid : primary_cash.uuid,
        debit : 0,
        credit : primary_cash.cost,
        document_uuid : primary_cash.uuid
      };

      connect.post('primary_cash', primary_cash)
      .then(function (){
        return connect.post('primary_cash_item', primary_cash_item);
      })
      .then(function (){
        return connect.fetch('/journal/cash_return/' + primary_cash.uuid);
      });
    }

    function setType (type){
      if (type) {
        session.data.type = type;
        cache.put('type', type);
      }
    }

    $scope.setCashAccount = setCashAccount;
    $scope.valid = valid;
    $scope.setType = setType;
    $scope.submit = submit;
  }
]);
