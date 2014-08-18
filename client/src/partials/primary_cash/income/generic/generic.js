angular.module('bhima.controllers')
.controller('primaryCash.income.generic', [
  '$scope',
  '$routeParams',
  'validate',
  'messenger',
  'appstate',
  'connect',
  'uuid',
  'util',
  function ($scope, $routeParams, validate, messenger, appstate, connect, uuid, util) {
    var isDefined, dependencies = {};
    var session = $scope.session = { receipt : {} };

    // TODO
    if (Number.isNaN(Number($routeParams.id))) {
      throw new Error('No cashbox selected');
    }

    isDefined = angular.isDefined;

    $scope.timestamp = new Date();

    session.today = $scope.timestamp.toISOString().slice(0, 10);

    dependencies.debtors = {
      query : {
        tables : {
          'patient' : {
            columns : ['uuid', 'debitor_uuid', 'project_id', 'reference', 'first_name', 'last_name']
          },
          'debitor' : {
            columns : ['group_uuid']
          },
          'debitor_group' : {
            columns : ['account_id']
          }
        },
        join : [
          'patient.debitor_uuid=debitor.uuid',
          'debitor.group_uuid=debitor_group.uuid'
        ]
      }
    };

    dependencies.currencies = {
      query : {
        tables : {
          'currency' : {
            columns : ['id', 'name', 'symbol']
          }
        }
      }
    };
 
    dependencies.projects = {
      query : {
        tables : {
          'project' : {
            columns : ['id', 'abbr']
          }
        }
      }
    };

    appstate.register('project', function (project) {
      $scope.project =  project;
      dependencies.projects.query.where =
        ['project.enterprise_id=' + project.enterprise_id];
      validate.process(dependencies)
      .then(function (models) {
        angular.extend($scope, models);
        session.receipt.date = new Date();
        session.receipt.cost = 0.00;
        session.receipt.cash_box_id = $routeParams.id;
      })
      .catch(function (err) {
        console.log('un problem');
        messenger.error(err);
      });
    });

    $scope.formatDebtor = function formatDebtor(debtor) {
      return [
        '[' + $scope.projects.get(debtor.project_id).abbr,
        debtor.reference + ']',
        debtor.first_name,
        debtor.last_name
      ].join(' ');
    };

    $scope.generate = function generate () {
      session.receipt.reference_uuid = uuid();
    };

    $scope.clear = function clear () {
      session.receipt = {};
      session.receipt.date = new Date();
      session.receipt.value = 0.00;
      session.receipt.cash_box_id = $routeParams.id;
    };

    function valid () {
      if (!session || !session.receipt) {
        session.invalid = true;
        return;
      }
      var r = session.receipt;

      session.invalid = !(isDefined(session.currency) &&
        isDefined(r.recipient) &&
        isDefined(r.cost) &&
        r.cost > 0 &&
        isDefined(r.description) &&
        isDefined(r.date) &&
        isDefined(r.cash_box_id));
    }

    function update (value) {
      session.receipt.recipient = value;
    }

    $scope.$watch('session.receipt', valid, true);
    $scope.$watch('session.currency', valid, true);

    $scope.submit = function submit () {
      var data, receipt = session.receipt;

      connect.fetch('/user_session')
      .then(function (user) {

        data = {
          uuid          : uuid(),
          reference     : 1,
          project_id    : $scope.project.id,
          type          : 'E',
          date          : util.sqlDate(receipt.date),
          deb_cred_uuid : receipt.recipient.creditor_uuid,
          deb_cred_type : 'C',
          account_id    : receipt.recipient.account_id,
          currency_id   : session.currency.id,
          cost          : receipt.cost,
          user_id       : user.id,
          description   : receipt.description + ' ID       : ' + receipt.reference_uuid,
          cash_box_id   : receipt.cash_box_id,
          origin_id     : 3,
        };

        return connect.basicPut('primary_cash', [data]);
      })
      .then(function () {
        var item = {
          uuid              : uuid(),
          primary_cash_uuid : data.uuid,
          debit             : data.cost,
          credit            : 0,
          document_uuid     : receipt.reference_uuid
        };
        return connect.basicPut('primary_cash_item', [item]);
      })
      .then(function () {
        return connect.fetch('/journal/primary_income/' + data.uuid);
      })
      .then(function () {
        messenger.success('Posted data successfully.');
        session = $scope.session = { receipt : {} };
        session.receipt.date = new Date();
        session.receipt.cost = 0.00;
        session.receipt.cash_box_id = $routeParams.id;
      });
    };

    $scope.update = update;
  }
]);
