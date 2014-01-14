//TODO Two step, download fiscal years, and then populate finance query, validate service will need to be updated
angular.module('kpk.controllers').controller('reportFinance', function($scope, $q, connect, appstate, validate, messenger) {
  var dependencies = {}, tableDefinition = {columns: [], options: []};

  dependencies.finance = { 
    required : true,
    identifier: "account_number",
    query : '/reports/finance/',
  };
 
  dependencies.fiscal = { 
    required : true,
    query : { 
      tables : { 
        fiscal_year : { 
          columns : ["id"]
        }
      }
    } 
  };
  
  validate.process(dependencies).then(reportFinance);

  function reportFinance(model) { 
    $scope.model = model;
    parseAccountDepth($scope.model.finance);
    settupTable($scope.model.fiscal.data);
  }
 
  function parseAccountDepth(accountModel) { 
    var accounts = accountModel.data; 
    
    accounts.forEach(function(account) { 
      var parent, depth = 0;
      parent = accountModel.get(account.parent);
      while(parent) { 
        depth++;
        parent = accountModel.get(parent.parent);
      }
      account.depth = depth;
    }); 
  }
 
  //TODO settupTable, toggleColumn, pushColumn and popColumn all improved and encapsulated within Table object, numColumns = 2, col 1 - budget, col 2 - realisation
  function settupTable(columnData) { 
    columnData.forEach(function(year, index) { 
      var tableOption = {active: false, id: year.id, index: index};
      tableDefinition.options.push(tableOption);
      toggleColumn(tableOption); 
    });
  }
  
  function toggleColumn(yearOption) { 
    var active = yearOption.active = !yearOption.active;
    if(active) return pushColumn(yearOption);     
    popColumn(yearOption);
  }

  function pushColumn(year) { 
    console.log(year, 'insert at', year.index);
    tableDefinition.columns.splice(year.index * 2, 0, {id: year.id, name: "Year " + year.id + " Budget", key: "budget_" + year.id});
    tableDefinition.columns.splice(year.index * 2, 0, {id: year.id, name: "Year " + year.id + " Realisation", key: "realisation_" + year.id});
  }

  function popColumn(year) { 

    //Avoid replacing the entire array, redrawing the DOM
    tableDefinition.columns.forEach(function(column, index) {
      if(column.id === year.id) tableDefinition.columns.splice(index, 2);
    });
  }

 
  function basicPrint() { print(); } 
 
  $scope.toggleYear = toggleColumn;
  $scope.basicPrint = basicPrint;
  $scope.tableDefinition = tableDefinition;
});
