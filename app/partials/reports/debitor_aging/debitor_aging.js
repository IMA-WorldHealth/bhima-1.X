angular.module('kpk.controllers').controller('reportDebitorAgingCtrl', function($scope, $q, $filter, connect, kpkUtilitaire){

	//variables
	
	$scope.models = {};
	$scope.results = [];
	var names = ['debitors', 'periods'];
	var debitors = {tables:{'debitor':{columns:['id', 'text']}, 'debitor_group':{columns:['account_id']}}, join:['debitor.group_id=debitor_group.id']};


	//fonctions

	function init (records){
		$scope.models[names[0]] = records[0].data;
		$scope.models[names[1]] = records[1].data;
		$scope.models.debitorAgings = records[2];
		$scope.periods = $scope.models.periods;
		getDebitorRecord();
	}

	var getBalance = function(){
		var def = $q.defer();
		connect.MyBasicGet('/reports/debitorAging/')
		.then(function(values){
			def.resolve(values);
		});
		return def.promise;
	}

	var checkExisting = function(idPeriod, idDebitor){
		return $scope.models.debitorAgings.some(function(item){
			return (item.id === idPeriod && item.idDebitor === idDebitor);
		});
	}

	var getRecord = function(debitor){
		var record = [];
		$scope.periods.forEach(function(period){
			if(checkExisting(period.id, debitor.id)){
				var balance = 0;
				$scope.models.debitorAgings.forEach(function(debitorAging){
					if(debitorAging.id == period.id && debitorAging.idDebitor == debitor.id) balance+=debitorAging.credit - debitorAging.debit;
				});
				record.push(balance);
			}else{
				record.push(0);
			}
		});
		return record;
	}

	var getDebitorRecord = function(){
		$scope.models.debitors.forEach(function(debitor){
			$scope.results.push({debitorName : debitor.text, balances : getRecord(debitor)});
		});

		console.log('notre model a afficher',$scope.results);
	}

	//invocations

	$q.all([connect.req(debitors), connect.debitorAgingPeriod(), getBalance()]).then(init);	
});
