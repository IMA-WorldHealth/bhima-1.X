angular.module('bhima.controllers')
.controller('IncomeExpenseModalController', [
	'$scope', 
	'$modalInstance', 
	'request', 
	'type',
	'validate', 
	'$location',
	function ($scope, $modalInstance, request, type, validate, $location) {
		var dependencies = { records : {} };

		$scope.loading = true;
		$scope.found   = false;

		dependencies.records.query = type === 'income' ? 
			'/reports/income_primary_report/?' + JSON.stringify(request) : 
			'/reports/expense_report/?' + JSON.stringify(request);  

		validate.refresh(dependencies, ['records'])
		.then(prepareReport)
		.catch(error);

		function prepareReport(model) {
			$scope.data = model.records;
			$scope.loading = false;
		}

		function error(err) {
			console.log(err);
		}

		$scope.goto = function (service, id) {
			$scope.found = false;
			$location.path('/invoice/' + service + '/' + id + '/');
			$scope.found = true;
		};

		$scope.ok = function () {
	    $modalInstance.close();
	  };
	}
]);