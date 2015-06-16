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
            columns : ['id', 'ref', 'text', 'position', 'reference_group_id', 'section_resultat_id']
          },
          'reference_group' : {
            columns : ['text::reference_group_txt' ]
          },
          'section_resultat' : {
            columns : ['text::section_resultat_txt' ]
          }                    
        },
        join : [
          'reference_group.id=reference.reference_group_id',
          'section_resultat.id=reference.section_resultat_id'
        ],
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

      connect.post('reference', [record])
      .then(function () {
        messenger.success($translate.instant('REFERENCE.SAVE_SUCCES'));        
        record.reference = generateReference(); 
        $scope.references.post(record);
        session.action = '';
        session.new = {};
      });
    };

    function generateReference () {
      window.data = $scope.references.data;
      var max = Math.max.apply(Math.max, $scope.references.data.map(function (o) { return o.reference; }));
      return Number.isNaN(max) ? 1 : max + 1;
    }
  }  
]);
