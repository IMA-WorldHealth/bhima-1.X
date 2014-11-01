angular.module('bhima.controllers')
.controller('stock_dashboard', [
	'$scope',
	'$q',
	'stockControl',
	function ($scope,$q,stockControl) {
		console.log('Service Stock Control');
	}
]);