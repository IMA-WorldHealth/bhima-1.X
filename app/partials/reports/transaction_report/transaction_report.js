angular.module('kpk.controllers').controller('reportTransactionController', function($scope, $q, $filter, connect){
	$scope.oneAtATime = true;
	var imports={},
	models = $scope.models = {},
    stores = $scope.stores = {},
    data = $scope.data = {};
	$scope.model = {};
	$scope.model['transReport'] = [];	
	$scope.report = {};

	var grid;
	var dataview;
	var sort_column = "trans_id";
	var columns = [
		{id: 'id', name: "ID", field: 'id', sortable: true},
	    {id: 'trans_id', name: "Transaction ID", field: 'trans_id', sortable: true},
	    {id: 'trans_date', name: 'Date', field: 'trans_date', formatter: formatDate},
	    {id:'account_number', name:'Account', field:'account_number'},
	    {id: 'debit', name: 'Debit', field: 'debit', groupTotalsFormatter: totalFormat, sortable: true, maxWidth:100},
	    {id: 'credit', name: 'Credit', field: 'credit', groupTotalsFormatter: totalFormat, sortable: true, maxWidth: 100},
	    {id: 'monnaie', name: 'Currency', field: 'name'},
	    {id: 'service', name: 'Service', field: 'service_txt'},
	    {id: 'names', name: 'Posted By', field: 'names'}
	];
  	var options = {
	    enableCellNavigation: true,
	    enableColumnReorder: true,
	    forceFitColumns: true,
	    rowHeight: 30
  	};  	  	

  	function popul() {
  		  		
  		var groupItemMetadataProvider = new Slick.Data.GroupItemMetadataProvider();
      	dataview = new Slick.Data.DataView({
	        groupItemMetadataProvider: groupItemMetadataProvider,
	        inlineFilter: true
      	});
      	grid = new Slick.Grid('#transaction_report_grid', dataview, columns, options);
      	grid.registerPlugin(groupItemMetadataProvider);
	    
	    dataview.onRowCountChanged.subscribe(function (e, args) {
	        grid.updateRowCount();
	        grid.render();
      	});
      	
      	dataview.onRowsChanged.subscribe(function (e, args) {
	        grid.invalidateRows(args.rows);
	        grid.render();
      	});

      	dataview.beginUpdate();
      	dataview.setItems($scope.model['transReport']);
	    dataview.endUpdate();
      	groupByService();
    }

    function fill(table){
		var tmp = {};
    	tmp[table]={columns:['id', 'text']};
    	var sql = {tables:tmp};
    	console.log(sql);
    	$q.all([connect.req(sql)]).then(function(reps){
    		$scope.chooses = reps[0].data;
    	});
    }

    function groupByService() {
	    dataview.setGrouping({
	      getter: "service_txt",
	      formatter: function (g) {
	        return "<span style='font-weight: bold'>" + g.value + "</span> (" + g.count + " transactions)</span>";
	      },
	      aggregators: [
	        new Slick.Data.Aggregators.Sum("debit"),
	        new Slick.Data.Aggregators.Sum("credit")
	      ],
	      aggregateCollapsed: false
	    });
  	}

    function totalFormat(totals, column) {
		var format = {};
		format['Credit'] = '#02BD02';
		format['Debit'] = '#F70303';

		var val = totals.sum && totals.sum[column.field];
		if (val !== null) {
		  return "<span style='font-weight: bold; color:" + format[column.name] + "'>" + ((Math.round(parseFloat(val)*100)/100)) + "</span>";
		}
		return "";
    }

    function formatDate (row, col, item) {
    	return $filter('date')(item);
  	}


    $scope.refresh = function (){   	  		

    	if($scope.report.deb_cred_type.toUpperCase() == 'DEBITOR'){
    		fill('debitor');
    		$scope.show1 = true;
    	}else if($scope.report.deb_cred_type.toUpperCase() == 'CREDITOR'){
    		fill('creditor');
    		$scope.show1 = true;
    	}else{
    		$scope.show1 = false;
    	}
    }

    $scope.fillRecords = function(){    	

    	if($scope.report.choosen){
    		$scope.show2 = true;
	        var type = $scope.report.deb_cred_type.toUpperCase().substring(0,1);
	        //kpkConnect.basicGet('/reports/transReport/?'+JSON.stringify({id:$scope.report.choosen.id, type:type})).then(function(values){
	        	//FIXME: basicGet throw an error
	          connect.MyBasicGet('/reports/transReport/?'+JSON.stringify({id:$scope.report.choosen.id, type:type})).then(function(values){
	          $scope.model['transReport'] = values;
	          doSummary(values);
	          popul();
	        });
      }else{
      		$scope.show2 = false;
      }
    }

    //FIXME: this function is not optimized, give me ideas please
    function doSummary(values){

    	if($scope.report.deb_cred_type.toUpperCase() == 'DEBITOR'){
			var objRequest1 = {
		      tables: {
		      	'debitor' : {columns: ["id"]},
		        'debitor_group' : {columns: ["account_id"]},        
		        'account' : {columns: ['account_number']}
		      },
		      join: ['debitor.group_id=debitor_group.id', 'debitor_group.account_id=account.id'],
		      where: ['debitor.id= '+$scope.report.choosen.id]
		    };
		    $q.all([connect.req(objRequest1)])
		    	.then(callbackSummary)
		    	.then(function(values){
		    		var objRequest2 = {
					      tables: {
					      	'posting_journal' : {columns: ["credit", "debit"]}
					      },
		      			 where: ['posting_journal.deb_cred_id= '+$scope.report.choosen.id, "AND", "posting_journal.deb_cred_type=D", "AND", "posting_journal.account_id="+values[0].data[0].account_id]
		    		};
		    		$q.all([connect.req(objRequest2)]).then(function(resultats){

			    	var creditTotal = debitTotal= 0;

			    	resultats[0].data.forEach(function(item){
			    		creditTotal+=item.credit;
			    		debitTotal+=item.debit;
			    	});
    				var soldTotal = debitTotal-creditTotal;
    				$scope.isBalanced = (soldTotal == 0)?"Yes":"No";
    				$scope.credit = creditTotal;
    				$scope.debit = debitTotal;
    				$scope.sold = (soldTotal<0)? soldTotal*(-1):soldTotal;
		    		});
		    });
			
    	}else if($scope.report.deb_cred_type.toUpperCase() == 'CREDITOR'){
    		var objRequest1 = {
		      tables: {
		      	'creditor' : {columns: ["id"]},
		        'creditor_group' : {columns: ["account_id"]},        
		        'account' : {columns: ['account_number']}
		      },
		      join: ['creditor.creditor_group_id=creditor_group.id', 'creditor_group.account_id=account.id'],
		      where: ['creditor.id= '+$scope.report.choosen.id]
		    };
		    $q.all([connect.req(objRequest1)])
		    	.then(callbackSummary)
		    	.then(function(values){
		    		var objRequest2 = {
					      tables: {
					      	'posting_journal' : {columns: ["credit", "debit"]}
					      },
		      			 where: ['posting_journal.deb_cred_id= '+$scope.report.choosen.id, "AND", "posting_journal.deb_cred_type=C", "AND", "posting_journal.account_id="+values[0].data[0].account_id]
		    		};
		    		$q.all([connect.req(objRequest2)]).then(function(resultats){

			    	var creditTotal = debitTotal= 0;

			    	resultats[0].data.forEach(function(item){
			    		creditTotal+=item.credit;
			    		debitTotal+=item.debit;
			    	});
			    	var soldTotal = debitTotal-creditTotal;
    				$scope.isBalanced = (soldTotal == 0)?"Yes":"No";
    				$scope.credit = creditTotal;
    				$scope.debit = debitTotal;
    				$scope.sold = (soldTotal<0)? soldTotal*(-1):soldTotal;
		    		});
		    	});
    	}
    }

    function callbackSummary(values){
    	var def = $q.defer();
    	def.resolve(values);
    	return def.promise;
    }

    //init();
});
