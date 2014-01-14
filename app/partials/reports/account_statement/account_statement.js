angular.module('kpk.controllers').controller('reportAccountStatementCtrl', function($scope, $q, $filter, connect, kpkUtilitaire){

	//variables
	$scope.models = {};
	var accounts, accountStatements;
	//var accountClasses = {tables:{'account':{columns:['id', 'account_txt']}}, where:['account.parent=0']};
	var accounts = {tables:{'account':{columns:['id', 'account_number', 'account_txt', 'parent']}}};
	var periods = {tables:{'period':{columns:['id', 'period_start', 'period_stop']}}};
	var names = ['accounts', 'periods'];	



	//fonctions

	function init(records){
		//async function
		$scope.models[names[0]] = records[0].data;
		$scope.models[names[1]] = records[1].data;
		accountStatements = records[2];

		//sync function
		transformAccountNumber();
		setStatAccount();
		console.log($scope.models.accounts[4]);
	}

	var transformAccountNumber = function (){
		$scope.models.accounts.map(function(item){
			item.account_number = item.account_number.toString();
		});
	}

	var getStatements = function(){
		var def = $q.defer();
		connect.MyBasicGet('/reports/accountStatement/')
		.then(function(values){
			def.resolve(values);
		});
		return def.promise;
	}

	var setStatAccount = function (){
		$scope.models.accounts.map(function(account){
			if(account.parent === 0) {
				account.stat = [];
			}else{
			account.stat = getPeriodStats(account.id);
			}
		});
	}

	var getPeriodStats = function(account_id){
		var periodStats = [];		
		$scope.models.periods.forEach(function (period) {
			var balance = 0;
			accountStatements.forEach(function(accountStatement){
				if(accountStatement.period_id === period.id && accountStatement.id === account_id) {
					balance+=(accountStatement.debit - accountStatement.credit);
				}
			});
			periodStats.push(balance);
		});	
		return periodStats;
	}		

	//invocations
	$q.all([connect.req(accounts),connect.req(periods), getStatements()]).then(init);


});
