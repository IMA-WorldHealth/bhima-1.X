angular.module('bhima.controllers')
.controller('stock_dashboard', [
	'$scope',
	'$q',
	'stockControl',
	function ($scope,$q,stockControl) {
		var session = $scope.session = {};

		var uuid = '538c3edc-853d-48bf-8d12-367a8cb1ed84';
		stockControl.inventoryData(uuid)
		.then(function (data) {
			console.log('Inventory : ',data);
		});
		
	}
]);