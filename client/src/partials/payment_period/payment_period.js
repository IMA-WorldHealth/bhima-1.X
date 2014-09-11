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
				config_rubric : { columns : ['label']}
			}
		}
	};

	dependencies.config_tax = {
		query : {
			tables : {
				config_tax : { columns : ['label']}
			}
		}
	};

	dependencies.paiement_period = {
		query : '/available_payment_period/'
	};

	function startup (models) {
      angular.extend($scope, models);
      console.log(models);
    }

	appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      validate.process(dependencies)
      .then(startup);
    });


}]);