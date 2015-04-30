angular.module('bhima.controllers')
.controller('cash.cashbox', [
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

    dependencies.cashbox = {
      query : {
        identifier : 'id',
        tables : {
          'cash_box' : { columns : ['id', 'text', 'project_id', 'is_auxillary', 'is_bank'] },
          'project' : { columns : ['abbr'] }
        },
        join : ['cash_box.project_id=project.id']
      }
    };

    dependencies.project = {
      query : {
        identifier : 'id',
        tables : {
          'project' : {
            columns : ['id', 'name', 'abbr']
          }
        }
      }
    };

    function startup (models) {
      angular.extend($scope, models);
      session.project = $scope.project;
    }

    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      validate.process(dependencies)
      .then(startup);
    });

    $scope.delete = function (cashbox) {
      connect.delete('cash_box', ['id'], [cashbox.id])
      .then(function () {
        $scope.cashbox.remove(cashbox.id);
        messenger.info($translate.instant('UTIL.DELETE_SUCCESS'));
      });
    };

    $scope.edit = function (cashbox) {
      session.action = 'edit';
      session.edit = angular.copy(cashbox);
    };

    $scope.new = function () {
      session.action = 'new';
      session.new = {};
    };

    $scope.save = {};

    $scope.save.edit = function () {
      var record = session.edit;
      record.project_id = session.edit.project_id;
      if (record.is_bank) {
        record.is_auxillary = 0;
      }
      delete record.abbr;
      connect.put('cash_box', [record], ['id'])
      .then(function () {
        messenger.info($translate.instant('UTIL.EDIT_SUCCESS'));
        session.action = '';
        session.edit = {};
        validate.refresh(dependencies, ['cashbox']).then(startup);
      });
    };

    $scope.save.new = function () {
      var record = session.new;
      record.project_id = session.new.project_id || 1;
      if (record.is_bank) {
        record.is_auxillary = 0;
      }
      connect.post('cash_box', [record])
      .then(function () {
        messenger.info($translate.instant('UTIL.NEW_SUCCESS'));
        session.action = '';
        session.new = {};
        validate.refresh(dependencies, ['cashbox']).then(startup);
      });
    };

    function generateReference () {
      window.data = $scope.cashbox.data;
      var max = Math.max.apply(Math.max, $scope.cashbox.data.map(function (o) { return o.id; }));
      return Number.isNaN(max) ? 1 : max + 1;
    }

  }
]);
