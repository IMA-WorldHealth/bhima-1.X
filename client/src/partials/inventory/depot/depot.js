angular.module('bhima.controllers')
.controller('inventory.depot', [
  '$scope',
  '$translate',
  'validate',
  'connect',
  'messenger',
  'appstate',
  'uuid',
  function ($scope, $translate, validate, connect, messenger, appstate, uuid) {
    var dependencies = {},
        session = $scope.session = {};

    dependencies.depots = {
      query : {
        identifier : 'uuid',
        tables : {
          'depot' : {
            columns : ['uuid', 'text', 'reference']
          }
        }
      }
    };

    function startup (models) {
      angular.extend($scope, models);
    }

    function error (err) {
      throw err;
      // messenger.error(err);
    }

    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      validate.process(dependencies)
      .then(startup)
      .catch(error);
    });

    $scope.delete = function (depot) {
      connect.basicDelete('depot', depot.uuid, 'uuid')
      .then(function () {
        $scope.depots.remove(depot.uuid);
        messenger.info($translate.instant('DEPOT.DELETE_SUCCESS'));
      })
      .catch(error);
    };

    $scope.edit = function (depot) {
      session.action = 'edit';
      session.edit = angular.copy(depot);
    };

    $scope.new = function () {
      session.action = 'new';
      session.new = {};
    };

    $scope.save = {};

    $scope.save.edit = function () {
      var record = connect.clean(session.edit);
      record.enterprise_id = $scope.enterprise.id;
      delete record.reference;
      connect.basicPost('depot', [record], ['uuid'])
      .then(function () {
        messenger.info('DEPOT.EDIT_SUCCESS');
        $scope.depots.put(record);
        session.action = '';
        session.edit = {};
      })
      .catch(error);
    };

    $scope.save.new = function () {
      var record = connect.clean(session.new);
      record.enterprise_id = $scope.enterprise.id;
      record.uuid = uuid();
      connect.basicPut('depot', [record])
      .then(function () {
        messenger.info('DEPOT.NEW_SUCCESS');
        // record.id = res.data.insertId;
        record.reference = generateReference(); // this is simply to make the ui look pretty;
        $scope.depots.post(record);
        session.action = '';
        session.new = {};
      })
      .catch(error);
    };

    function generateReference () {
      window.data = $scope.depots.data;
      var max = Math.max.apply(Math.max, $scope.depots.data.map(function (o) { return o.reference; }));
      return Number.isNaN(max) ? 1 : max + 1;
    }

  }
]);
