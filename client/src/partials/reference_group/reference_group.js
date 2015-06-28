angular.module('bhima.controllers')
.controller('reference_group', [
  '$scope',
  '$translate',
  'validate',
  'messenger',
  'connect',
  'appstate',
  function ($scope, $translate, validate, messenger, connect, appstate) {
    var dependencies = {},
        session = $scope.session = {};

    dependencies.reference_groups = {
      query : {
        identifier : 'id',
        tables : {
          'reference_group' : {
            columns : ['id', 'reference_group', 'text', 'position', 'section_bilan_id']
          },
          'section_bilan' : {
            columns : ['text::section_bilan_txt']
          }          
        },
        join : [
          'reference_group.section_bilan_id=section_bilan.id'
        ],
      }
    };

    dependencies.section_bilan = {
      query : {
        tables : {
          'section_bilan' : {
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

    $scope.delete = function (reference_group) {
      var result = confirm($translate.instant('REFERENCE_GROUP.CONFIRM'));
      if (result) {  
        connect.delete('reference_group', ['id'], [reference_group.id])
        .then(function () {
          $scope.reference_groups.remove(reference_group.id);
          messenger.info($translate.instant('REFERENCE_GROUP.DELETE_SUCCESS'));
        });
      }
    };

    $scope.edit = function (reference_group) {
      session.action = 'edit';
      session.edit = angular.copy(reference_group);
    };

    $scope.new = function () {
      session.action = 'new';
      session.new = {};
    };

    $scope.save = {};

    $scope.save.edit = function () {
      var record = connect.clean(session.edit);
      delete record.reference;
      delete record.section_bilan_txt;

      connect.put('reference_group', [record], ['id'])
      .then(function () {
        messenger.success($translate.instant('REFERENCE_GROUP.UPDATE_SUCCES')); 
        $scope.reference_groups.put(record);
        session.action = '';
        session.edit = {};
      });
    };

    $scope.save.new = function () {
      var record = connect.clean(session.new);

      connect.post('reference_group', [record])
      .then(function () {
        messenger.success($translate.instant('REFERENCE_GROUP.SAVE_SUCCES'));        
        record.reference = generateReference(); 
        $scope.reference_groups.post(record);
        session.action = '';
        session.new = {};
      });
    };

    function generateReference () {
      window.data = $scope.reference_groups.data;
      var max = Math.max.apply(Math.max, $scope.reference_groups.data.map(function (o) { return o.reference; }));
      return Number.isNaN(max) ? 1 : max + 1;
    }
  }  
]);
