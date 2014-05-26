angular.module('bhima.controllers')
.controller('inventory.depot', [
  '$scope',
  '$translate',
  'validate',
  'connect',
  'messenger',
  'appstate',
  function ($scope, $translate, validate, connect, messenger, appstate) {
    var dependencies = {},
        session = $scope.session = {};

    dependencies.depots = {
      query : {
        idintifier : 'uuid',
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
      connect.basicDelete('depot', 'uuid', depot.uuid)
      .then(function () {
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
      connect.basicPut('depot', [record])
      .then(function (res) {
        messenger.info('DEPOT.NEW_SUCCESS');
        // record.id = res.data.insertId;
        $scope.depots.post(record);
        session.action = '';
        session.new = {};
      })
      .catch(error);
    };

  }
]);
