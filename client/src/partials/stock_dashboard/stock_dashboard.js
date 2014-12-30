angular.module('bhima.controllers')
.controller('stock_dashboard', [
	'$scope',
	'$q',
	'stockControl',
	function ($scope,$q,stockControl) {
		var session = $scope.session = {};

		var uuid = '248c675a-7013-4b98-9301-27c8277a3ce2';

		stockControl.getNombreMoisAVG(uuid)
		.then(function (data) {
			console.log('NB : ', data);
		});

		stockControl.consommationMensuelleSingle(uuid)
		.then(function (data) {
			console.log('CM : ', data);
		});

		// Delai Livraison
		stockControl.getDelaiLivraison(uuid)
		.then(function (data) {
			console.log('DL : ',data);
		});

		// Stock Security
		stockControl.getStockSecurity(uuid)
		.then(function (data) {
			console.log('SS : ', data);
		});

	}
]);