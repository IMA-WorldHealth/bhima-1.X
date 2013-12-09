angular.module('kpk.controllers').controller('reportTransactionController', function($scope, kpkConnect){
	$scope.model = {};
	$scope.model['transReport'] = [];	
	$scope.report = {};
	var grid;
	var dataview;
	var sort_column = "trans_id";
	var columns = [
		{id: 'id', name: "ID", field: 'id', sortable: true},
	    {id: 'trans_id', name: "Transaction ID", field: 'trans_id', sortable: true},
	    {id: 'trans_date', name: 'Date', field: 'trans_date'},
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

  	function init() {
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
    	var sql = {
    			'entities':[{'t':table, 'c':['id', 'text']}],
    	}
		kpkConnect.get('/data/?', sql).then(function(value){
				$scope.chooses = value;
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


    $scope.refresh = function (){
    	if($scope.report.deb_cred_type.toUpperCase() == 'DEBITOR'){
    		fill('debitor');
    	}else if($scope.report.deb_cred_type.toUpperCase() == 'CREDITOR'){
    		fill('creditor');
    	}
    }

    $scope.fillRecords = function(){    	
    	if($scope.report.choosen){
        var type = $scope.report.deb_cred_type.toUpperCase().substring(0,1);
        kpkConnect.basicGet('/reports/transReport/?'+JSON.stringify({id:$scope.report.choosen.id, type:type})).then(function(value){
          $scope.model['transReport'] = value;
          init();
        });
      }
    }

    //init();
});
