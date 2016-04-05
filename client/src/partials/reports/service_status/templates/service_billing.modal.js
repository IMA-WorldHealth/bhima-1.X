angular.module('bhima.controllers')
.controller('ServiceBillingModalController', [
	'$scope', 
	'$http',
	'$modalInstance', 
	'request',
	'validate', 
	'$location',
	function ($scope, $http, $modalInstance, request, validate, $location) {
		var dependencies = { records : {} };

		$scope.loading = true;
		$scope.found   = false;

		$http.get('/service_status/' + request.id, { params : request })
		.then(prepareReport)
		.catch(error);

		function prepareReport(rows) {
			$scope.data = rows;
			$scope.loading = false;
			$scope.serviceName = rows.data[0] ? rows.data[0].name : '';
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