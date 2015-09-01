angular.module('bhima.controllers')
.controller('offdays', [
  '$scope',
  '$translate',
  '$http',
  'validate',
  'messenger',
  'connect',
  'appstate',
  'util',
  function ($scope, $translate, $http, validate, messenger, connect, appstate, util) {
    var dependencies = {},
        session = $scope.session = {};

    dependencies.offdays = {
      query : {
        identifier : 'id',
        tables : {
          'offday' : {
            columns : ['id', 'label', 'date', 'percent_pay']
          }
        }
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

    $scope.delete = function (offday) {
      var result = confirm($translate.instant('OFFDAY_MANAGEMENT.CONFIRM'));
      if (result) {
        connect.basicDelete('offday', offday.id, 'id')
        .then(function () {
          $scope.offdays.remove(offday.id);
          messenger.info($translate.instant('OFFDAY_MANAGEMENT.DELETE_SUCCESS'));
        });
      }
    };

    $scope.edit = function (offday) {
      session.action = 'edit';
      offday.date = new Date(offday.date);
      session.edit = angular.copy(offday);
    };

    $scope.new = function () {
      session.action = 'new';
      session.new = {};
    };

    $scope.save = {};

    $scope.save.edit = function () {
      session.edit.date = util.sqlDate(session.edit.date);
        var record = connect.clean(session.edit);
        delete record.reference;

      $http.get('/getCheckOffday/',{params : {
            'date' : record.date,
            'id'   : record.id
          }
        }).
      success(function(data) {
        if(data.length === 0){
          connect.basicPost('offday', [record], ['id'])
          .then(function () {
          messenger.success($translate.instant('OFFDAY_MANAGEMENT.UPDATE_SUCCES'));
          $scope.offdays.put(record);
          session.action = '';
          session.edit = {};
          });
        } else {
          messenger.danger($translate.instant('OFFDAY_MANAGEMENT.SAVE_FAILURE'));
        }
      });
    };

    $scope.save.new = function () {
      session.new.date = util.sqlDate(session.new.date);
      var record = connect.clean(session.new);

      $http.get('/getCheckOffday/',{params : {
            'date' : record.date,
            'id'   : ''
          }
        }).
      success(function(data) {
        if(data.length === 0){
          connect.basicPut('offday', [record])
          .then(function (res) {
            messenger.success($translate.instant('OFFDAY_MANAGEMENT.SAVE_SUCCES')); 
            record.id = res.data.insertId;
            record.reference = generateReference(); // this is simply to make the ui look pretty;
            $scope.offdays.post(record);
            session.action = '';
            session.new = {};
          });
        } else {
          messenger.danger($translate.instant('OFFDAY_MANAGEMENT.SAVE_FAILURE'));
        }
      });
    };


    function generateReference () {
      window.data = $scope.offdays.data;
      var max = Math.max.apply(Math.max, $scope.offdays.data.map(function (o) { return o.reference; }));
      return Number.isNaN(max) ? 1 : max + 1;
    }
  }
]);
