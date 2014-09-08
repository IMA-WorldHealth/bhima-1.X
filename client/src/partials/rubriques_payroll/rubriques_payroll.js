angular.module('bhima.controllers')
.controller('rubriques_payroll', [
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

    dependencies.rubrics = {
      query : {
        tables : {
          'rubric' : {
            columns : ['id', 'label', 'is_discount', 'is_percent', 'value']
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

    $scope.delete = function (rubric) {
      var result = confirm($translate.instant('RUBRIC_PAYROLL.CONFIRM'));
      if (result) {  
        connect.basicDelete('rubric', rubric.id, 'id')
        .then(function () {
          $scope.rubrics.remove(rubric.id);
          messenger.info($translate.instant('RUBRIC_PAYROLL.DELETE_SUCCESS'));
        });
      }
    };

    $scope.edit = function (rubric) {
      session.action = 'edit';
      session.edit = angular.copy(rubric);
    };

    $scope.new = function () {
      session.action = 'new';
      session.new = {};
    };

    $scope.save = {};

    $scope.save.edit = function () {
      session.edit.is_percent = checkValue(session.edit.is_percent);
      session.edit.is_discount = checkValue(session.edit.is_discount);
      var record = connect.clean(session.edit);
      delete record.reference;
      connect.basicPost('rubric', [record], ['id'])
      .then(function () {
        messenger.success($translate.instant('RUBRIC_PAYROLL.UPDATE_SUCCES')); 
        $scope.rubrics.put(record);
        session.action = '';
        session.edit = {};
      });
    };

    $scope.save.new = function () {
      var record = connect.clean(session.new);
      connect.basicPut('rubric', [record])
      .then(function () {
        messenger.success($translate.instant('RUBRIC_PAYROLL.SAVE_SUCCES'));        
        // record.id = res.data.insertId;
        record.reference = generateReference(); // this is simply to make the ui look pretty;
        $scope.rubrics.post(record);
        session.action = '';
        session.new = {};
      });
    };

    function generateReference () {
      window.data = $scope.rubrics.data;
      var max = Math.max.apply(Math.max, $scope.rubrics.data.map(function (o) { return o.reference; }));
      return Number.isNaN(max) ? 1 : max + 1;
    }


    var checkValue = function(value){
    	if(value === true){return 1;}
    	else {return 0;}
    };
    $scope.checkValue = checkValue;

    $scope.checkedYesOrNo = function(value){
    	if(value == 1) {return $translate.instant('RUBRIC_PAYROLL.YES');}
    	else {return $translate.instant('RUBRIC_PAYROLL.NO');}
    };
  }  
]);
