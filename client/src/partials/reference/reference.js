angular.module('bhima.controllers')
.controller('reference', [
  '$scope',
  '$translate',
  'validate',
  'messenger',
  'connect',
  'appstate',
  function ($scope, $translate, validate, messenger, connect, appstate) {
    var dependencies = {},
        session = $scope.session = {};

    dependencies.references = {
      query : {
        identifier : 'id',
        tables : {
          'reference' : {
            columns : ['id', 'ref', 'text', 'position', 'reference_group_id', 'section_resultat_id', 'is_report']
          }                    
        }
      }
    };

    dependencies.reference_groups = {
      query : {
        tables : {
          'reference_group' : {
            columns : ['id', 'text']
          }
        }
      }
    };

    dependencies.section_resultat = {
      query : {
        tables : {
          'section_resultat' : {
            columns : ['id', 'text']
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

    $scope.delete = function (reference) {
      var result = confirm($translate.instant('REFERENCE.CONFIRM'));
      if (result) {  
        connect.delete('reference', ['id'], [reference.id])
        .then(function () {
          $scope.references.remove(reference.id);
          messenger.info($translate.instant('REFERENCE.DELETE_SUCCESS'));
        });
      }
    };

    $scope.edit = function (reference) {
      session.action = 'edit';
      session.edit = angular.copy(reference);
      session.edit.is_report = session.edit.is_report !== 0;
    };

    $scope.new = function () {
      session.action = 'new';
      session.new = {};
    }; 

    $scope.save = {};

    $scope.save.edit = function () {
      var record = connect.clean(session.edit);
      delete record.reference;
      delete record.reference_group_txt;
      delete record.section_resultat_txt;

      record.reference_group_id = session.edit.reference_group_id;
      record.section_resultat_id = session.edit.section_resultat_id;      
      record.is_report = (session.edit.is_report)?1:0;

      connect.put('reference', [record], ['id'])
      .then(function () {
        messenger.success($translate.instant('REFERENCE.UPDATE_SUCCES')); 
        $scope.references.put(record);
        session.action = '';
        session.edit = {};
      });
    };

    $scope.save.new = function () {
      var record = connect.clean(session.new);

      record.reference_group_id = session.new.reference_group_id;
      record.section_resultat_id = session.new.section_resultat_id;
      record.is_report = (session.new.is_report)?1:0;

      connect.post('reference', [record])
      .then(function (res) {
        messenger.success($translate.instant('REFERENCE.SAVE_SUCCES'));        
        record.id = res.data.insertId;
        $scope.references.post(record);
        session.action = '';
        session.new = {};
      });
    };

  }  
]);
