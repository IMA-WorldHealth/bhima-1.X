angular.module('kpk.controllers').controller('reportDebitorAgingCtrl', function($scope, $q, connect, appstate){

	//variables
	
	$scope.models = {};
	$scope.results = [];
	var debitors, periods;
	var names = ['debitors', 'periods'];
	

	//fonctions

	function init (records){
		$scope.models[names[0]] = records[0].data;
		$scope.models[names[1]] = records[1].data;
		$scope.models.debitorAgings = records[2];
		getDebitorRecord();
	}

	var getBalance = function(fiscal_id){
		var def = $q.defer();
		connect.MyBasicGet('/reports/debitorAging/?'+JSON.stringify({fiscal_id : fiscal_id}))
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
		$scope.models.periods.forEach(function(period){
			var balance = 0;
			if(checkExisting(period.id, debitor.id)){				
				$scope.models.debitorAgings.forEach(function(debitorAging){
					if(debitorAging.id == period.id && debitorAging.idDebitor == debitor.id) balance+=debitorAging.credit - debitorAging.debit;
				});				
			}
			record.push(balance);
		});
		return record;
	}

	var getDebitorRecord = function(){
		$scope.models.debitors.forEach(function(debitor){
			$scope.results.push({debitorName : debitor.text, balances : getRecord(debitor)});
		});
	}

	//invocation
	
	appstate.register('fiscal', function(fiscal){		
		debitors = {tables:{'debitor':{columns:['id', 'text']}, 'debitor_group':{columns:['account_id']}}, join:['debitor.group_id=debitor_group.id'], where : ['debitor_group.enterprise_id='+fiscal.enterprise_id]};
		periods = {tables:{'period':{columns:['id', 'period_start', 'period_stop']}}, where : ['period.fiscal_year_id='+fiscal.id]};
		$q.all([connect.req(debitors), connect.req(periods), getBalance(fiscal.id)]).then(init);
	});
});
