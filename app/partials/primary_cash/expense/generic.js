angular.module('kpk.controllers')
.controller('primaryCash.expense', [
  '$scope',
  '$routeParams',
  'validate',
  'messenger',
  'appstate',
  'uuid',
  'util',
  function ($scope, $routeParams, validate, messenger, appstate, uuid, util) {
    var dependencies = {};
    var session = $scope.session = { receipt : {} };

    $scope.timestamp = new Date();

    session.today = $scope.timestamp.toISOString().slice(0, 10);

    dependencies.supplier = {
      query : {
        tables : {
          'supplier' : {
            columns : ['uuid', 'creditor_uuid', 'name', 'address_1', 'address_2', 'location_id', 'email']
          },
          'creditor' : {
            columns : ['group_uuid']
          }
        },
        join : ['supplier.uuid=creditor.group_uuid']
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

    appstate.register('project', function (project) {
      $scope.project =  project;
      validate.process(dependencies)
      .then(function (models) {
        angular.extend($scope, models);
        session.receipt.date = new Date().toISOString().slice(0, 10);
      })
      .catch(function (err) {
        messenger.error(err);
      });
    });

    function formatDates () {
      session.receipt.date = util.toMysqlDate(session.receipt.date);
    }

    $scope.generate = function generate () {
      session.receipt.purchase_uuid = uuid();
    };

    $scope.clear = function clear () {
      $scope.session.receipt = {};
    };

    $scope.submit = function submit () {
      session.receipt.uuid = uuid();
      formatDates();
      session.receipt.currency_id =  session.currency.id;
      session.receipt.istransfer = 0;


    };
  }
]);
