angular.module('bhima.controllers')
.controller('justifyModal', ['$scope', '$modalInstance', 'data', justifyModal]);

function justifyModal($scope, $modalInstance, data) {
	$scope.bill = data;
	$scope.bill.valid = false;

	$scope.submit = function () {
	  $modalInstance.close($scope.bill.justification);
	};

	$scope.cancel = function () {
	  $modalInstance.dismiss();
	};

	$scope.$watch('bill.justification', function () {
	  $scope.bill.valid = $scope.bill.justification ? $scope.bill.justification.length > 25 : false;
	});
}
