angular.module('bhima.controllers')
.controller('hollydays', [
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

    dependencies.hollydays = {
      query : {
        identifier : 'id',
        tables : {
          'hollyday' : { columns : ['id', 'employee_id', 'label', 'dateFrom', 'dateTo'] },
          'employee' : { columns : ['name', 'postnom', 'prenom']}
        },
        join : ['hollyday.employee_id=employee.id']
      }
    };

    dependencies.employees = {
      query : {
        identifier : 'id',
        tables : {
          'employee' : { columns : ['id','name', 'postnom', 'prenom']}
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

    $scope.delete = function (hollyday) {
      var result = confirm($translate.instant('HOLLYDAY_MANAGEMENT.CONFIRM'));
      if (result) {  
        connect.basicDelete('hollyday', hollyday.id, 'id')
        .then(function () {
          $scope.hollydays.remove(hollyday.id);
          messenger.info($translate.instant('HOLLYDAY_MANAGEMENT.DELETE_SUCCESS'));
        });
      }
    };

    $scope.edit = function (hollyday) {
      session.action = 'edit';
      hollyday.dateFrom = new Date(hollyday.dateFrom);
      hollyday.dateTo = new Date(hollyday.dateTo);
      session.edit = angular.copy(hollyday);
      //console.log(session.edit.date);
    };

    $scope.new = function () {
      session.action = 'new';
      session.new = {};
    };

    $scope.save = {};

    $scope.save.edit = function () {
      session.edit.dateFrom = util.sqlDate(session.edit.dateFrom);
      session.edit.dateTo = util.sqlDate(session.edit.dateTo);
      var record = connect.clean(session.edit);
      console.log(record);
      delete record.reference;
      delete record.name;
      delete record.postnom;
      delete record.prenom;
      delete record.date;

      $http.get('/getCheckHollyday/',{params : {
          'dateFrom' : record.dateFrom, 
          'dateTo' : record.dateTo,
          'employee_id' : record.employee_id,
          'line' : record.id
        }
      }).
      success(function(data) {
        console.log(data);
        if(data.length === 0){        
          connect.basicPost('hollyday', [record], ['id'])
          .then(function () {
            validate.refresh(dependencies)
            .then(function (models) {
              angular.extend($scope, models);
              messenger.success($translate.instant('HOLLYDAY_MANAGEMENT.UPDATE_SUCCES'));
              session.action = '';
              session.edit = {};
            }); 
          });
        } else if (data.length > 0){
           messenger.danger($translate.instant('HOLLYDAY_MANAGEMENT.SAVE_FAILURE')); 
           session.action = '';
        }          
      });
    };

    $scope.save.new = function () {
      session.new.dateFrom = util.sqlDate(session.new.dateFrom);
      session.new.dateTo = util.sqlDate(session.new.dateTo);
      //console.log(session.new);
      var record = connect.clean(session.new);

      $http.get('/getCheckHollyday/',{params : {
          'dateFrom' : record.dateFrom, 
          'dateTo' : record.dateTo,
          'employee_id' : record.employee_id,
          'line' : ""
        }
      }).
      success(function(data) {
        if(data.length === 0){
          connect.basicPut('hollyday', [record])
          .then(function (res) {
            messenger.success($translate.instant('HOLLYDAY_MANAGEMENT.SAVE_SUCCES'));        
            
            validate.refresh(dependencies)
            .then(function (models) {
              angular.extend($scope, models);
            });
            session.action = '';
            session.new = {};
          });          
        } else if (data.length > 0){
           messenger.danger($translate.instant('HOLLYDAY_MANAGEMENT.SAVE_FAILURE'));  
           session.action = '';
        }
      });
    };

    function generateReference () {
      window.data = $scope.hollydays.data;
      var max = Math.max.apply(Math.max, $scope.hollydays.data.map(function (o) { return o.reference; }));
      return Number.isNaN(max) ? 1 : max + 1;
    }
  }  
]);
