angular.module('bhima.controllers')
.controller('grade', [
  '$scope',
  '$translate',
  'validate',
  'messenger',
  'connect',
  'appstate',
  'uuid',
  function ($scope, $translate, validate, messenger, connect, appstate, uuid) {
    var dependencies = {},
        session = $scope.session = {};

    dependencies.grades = {
      query : {
        identifier : 'uuid',
        tables : {
          'grade' : {
            columns : ['uuid', 'code', 'text', 'basic_salary']
          }
        }
      }
    };

    dependencies.enterprise = {
      query : {
        tables : {
          'enterprise' : {
            columns : ['currency_id']
          },
          'currency' : {
            columns : ['id', 'symbol']
          }
        },
        join : [
            'enterprise.currency_id=currency.id'
          ]
        }
    };

    function startup (models) {
      angular.extend($scope, models);
    }

    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      validate.process(dependencies)
      .then(startup);
    });

    $scope.delete = function (grade) {
      var result = confirm($translate.instant('GRADE.CONFIRM'));
      if (result) {  
        connect.basicDelete('grade', grade.uuid, 'uuid')
        .then(function () {
          $scope.grades.remove(grade.uuid);
          messenger.info($translate.instant('GRADE.DELETE_SUCCESS'));
        });
      }
    };

    $scope.edit = function (grade) {
      session.action = 'edit';
      session.edit = angular.copy(grade);
    };

    $scope.new = function () {
      session.action = 'new';
      session.new = {};
    };

    $scope.save = {};

    $scope.save.edit = function () {
      var record = connect.clean(session.edit);
      delete record.reference;
      connect.basicPost('grade', [record], ['uuid'])
      .then(function () {
        messenger.success($translate.instant('GRADE.UPDATE_SUCCES')); 
        $scope.grades.put(record);
        session.action = '';
        session.edit = {};
      });
    };

    $scope.save.new = function () {
      var record = connect.clean(session.new);
      record.uuid = uuid();
      connect.basicPut('grade', [record])
      .then(function () {
        messenger.success($translate.instant('GRADE.SAVE_SUCCES'));        
        // record.id = res.data.insertId;
        record.reference = generateReference(); // this is simply to make the ui look pretty;
        $scope.grades.post(record);
        session.action = '';
        session.new = {};
      });
    };

    function generateReference () {
      window.data = $scope.grades.data;
      var max = Math.max.apply(Math.max, $scope.grades.data.map(function (o) { return o.reference; }));
      return Number.isNaN(max) ? 1 : max + 1;
    }
  }  
]);
