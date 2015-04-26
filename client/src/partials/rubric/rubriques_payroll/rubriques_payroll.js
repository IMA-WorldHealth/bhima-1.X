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
            columns : ['id', 'label', 'abbr', 'is_advance', 'is_percent', 'is_discount', 'is_social_care', 'value']
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
      session.edit.is_advance = (session.edit.is_advance)!==0;
      session.edit.is_percent = (session.edit.is_percent)!==0;
      session.edit.is_discount = (session.edit.is_discount)!==0;
    };

    $scope.new = function () {
      session.action = 'new';
      session.new = {};
    };

    $scope.save = {};

    $scope.save.edit = function () {
      session.edit.is_advance = (session.edit.is_advance)?1:0;
      session.edit.is_percent = (session.edit.is_percent)?1:0;
      session.edit.is_discount = (session.edit.is_discount)?1:0;

      var rubrics = $scope.rubrics.data,
        advance_exist = 0;

      rubrics.forEach(function (rub) {

        if(rub.is_advance && rub.id !== session.edit.id){
          advance_exist = 1;          
        }
      });

      if(session.edit.is_advance && advance_exist){
        messenger.danger($translate.instant('RUBRIC_PAYROLL.NOT_ADVANCE'));
      } else if(session.edit.is_advance && !advance_exist  && !session.edit.is_discount){
        messenger.danger($translate.instant('RUBRIC_PAYROLL.BE_DISCOUNT'));
      } else {
        var record = connect.clean(session.edit);
        delete record.reference;
        if (record.abbr) {
          if (record.abbr.length <= 4) {
            connect.basicPost('rubric', [record], ['id'])
            .then(function () {
              messenger.success($translate.instant('RUBRIC_PAYROLL.UPDATE_SUCCES'));
              $scope.rubrics.put(record);
              session.action = '';
              session.edit = {};
            });
          } else if (record.abbr.length > 4) {
            messenger.danger($translate.instant('RUBRIC_PAYROLL.NOT_SUP4'));
          }
        } else {
          messenger.danger($translate.instant('RUBRIC_PAYROLL.NOT_EMPTY'));
        }
      }
    };

    $scope.save.new = function () {
      session.new.is_advance = (session.new.is_advance)?1:0;
      session.new.is_percent = (session.new.is_percent)?1:0;
      session.new.is_discount = (session.new.is_discount)?1:0;

      var rubrics = $scope.rubrics.data,
        advance_exist = 0;
      if(rubrics.length){
        rubrics.forEach(function (rub) {
          if(rub.is_advance){
            advance_exist = 1;          
          }
        });
      }  

      if(session.new.is_advance && advance_exist){
        messenger.danger($translate.instant('RUBRIC_PAYROLL.NOT_ADVANCE'));
        session.new.is_advance = null;
      } else if(session.new.is_advance && !advance_exist  && !session.new.is_discount){
        messenger.danger($translate.instant('RUBRIC_PAYROLL.BE_DISCOUNT'));
        session.new.is_advance = null;
      } else {
        var record = connect.clean(session.new);
        if (record.abbr) {
          if (record.abbr.length <= 4) {
            connect.basicPut('rubric', [record])
            .then(function () {
              messenger.success($translate.instant('RUBRIC_PAYROLL.SAVE_SUCCES'));
              record.reference = generateReference();
              $scope.rubrics.post(record);
              session.action = '';
              session.new = {};
            });
          } else if (record.abbr.length > 4) {
            messenger.danger($translate.instant('RUBRIC_PAYROLL.NOT_SUP4'));
          }
        } else {
          messenger.danger($translate.instant('RUBRIC_PAYROLL.NOT_EMPTY'));
        }        
      }
    };

    function generateReference () {
      window.data = $scope.rubrics.data;
      var max = Math.max.apply(Math.max, $scope.rubrics.data.map(function (o) { return o.reference; }));
      return Number.isNaN(max) ? 1 : max + 1;
    }

    $scope.checkedYesOrNo = function (value) {
    	if (value === 1) {return $translate.instant('RUBRIC_PAYROLL.YES');}
    	else {return $translate.instant('RUBRIC_PAYROLL.NO');}
    };
  }
]);
