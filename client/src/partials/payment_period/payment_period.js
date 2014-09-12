angular.module('bhima.controllers')
.controller('payment_period', [
'$scope',
'$translate',
'validate',
'messenger',
'connect',
'appstate',
'uuid',
function($scope, $translate, validate, messenger, connect, appstate, uuid){
	var dependencies = {},
		session = $scope.session = {};
	
	dependencies.config_rubric = {
		query : {
			tables : {
				config_rubric : { columns : ['id', 'label']}
			}
		}
	};

	dependencies.config_tax = {
		query : {
			tables : {
				config_tax : { columns : ['id', 'label']}
			}
		}
	};

	dependencies.paiement_period = {
		query : '/available_payment_period/'
	};

	function startup (models) {
      angular.extend($scope, models);
    }

	appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      validate.process(dependencies)
      .then(startup);
    });

    $scope.delete = function (period) {
      var result = confirm($translate.instant('PAYMENT_PERIOD.CONFIRM'));
      if (result) {  
        connect.basicDelete('paiement_period', period.id, 'id')
        .then(function () {
          $scope.paiement_period.remove(period.id);
          messenger.info($translate.instant('PAYMENT_PERIOD.DELETE_SUCCESS'));
        });
      }
    };

    $scope.edit = function (period) {
      session.action = 'edit';
      session.edit = angular.copy(period);
      session.edit.dateFrom = new Date(session.edit.dateFrom);
      session.edit.dateTo = new Date(session.edit.dateTo);
      delete session.edit.RUBRIC;
      delete session.edit.TAX;
    };

    $scope.new = function () {
      session.action = 'new';
      session.new = {};
      session.new.dateFrom = new Date();
      session.new.dateTo = new Date();
    };

    $scope.save = {};

    $scope.save.edit = function () {
      var record = connect.clean(session.edit);
      delete record.reference;
      connect.basicPost('paiement_period', [record], ['id'])
      .then(function () {
        messenger.success($translate.instant('PAYMENT_PERIOD.UPDATE_SUCCES')); 
        $scope.paiement_period.put(record);
        session.action = '';
        session.edit = {};

        validate.refresh(dependencies)
      	.then(startup);

      });
    };

    $scope.save.new = function () {
      var record = connect.clean(session.new);
      connect.basicPut('paiement_period', [record])
      .then(function () {
        messenger.success($translate.instant('PAYMENT_PERIOD.SAVE_SUCCES'));
        record.reference = generateReference();
        $scope.paiement_period.post(record);
        session.action = '';
        session.new = {};

        validate.refresh(dependencies)
      	.then(startup);

      });
    };

    function generateReference () {
      window.data = $scope.paiement_period.data;
      var max = Math.max.apply(Math.max, $scope.paiement_period.data.map(function (o) { return o.reference; }));
      return Number.isNaN(max) ? 1 : max + 1;
    }


}]);