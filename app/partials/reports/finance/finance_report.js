//TODO Two step, download fiscal years, and then populate finance query, validate service will need to be updated
angular.module('kpk.controllers').controller('reportFinance', function($scope, $q, connect, appstate, validate, messenger) {
  var dependencies = {}, fiscalYears = [], tableDefinition = {columns: [], options: []}, financeGroups = {index: {}, store: []};

  dependencies.finance = { 
    required : true,
    identifier: "account_number"
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
  
  validate.process(dependencies, ['fiscal']).then(buildReportQuery);

  function buildReportQuery(model) {
    fiscalYears.push(model.fiscal.data[0].id);
    // model.fiscal.data.forEach(function(year) { fiscalYears.push(year.id); });
    dependencies.finance.query = '/reports/finance/?' + JSON.stringify({fiscal: fiscalYears});
    return validate.process(dependencies).then(reportFinance);
  }

  function reportFinance(model) { 
    $scope.model = model;
    parseAccountDepth($scope.model.finance);
    settupTable(fiscalYears);

    generateAccountGroups($scope.model.finance);
  }
   
  //TODO Relies on data being in correct order at time of parsing (i.e all children following parent)
  //if parent hasn't been parsed, a placeholder should be set (allowing any ordering of data)
  
  // TODO calculate totals seperately 
  function generateAccountGroups(accountModel, targetObj) { 
    var accounts = accountModel.data, ROOT = 0, TITLE = 3;
    var index = financeGroups.index, store = financeGroups.store;
    
    accounts.forEach(function(account) { 
      var insertAccount = { 
        detail : account
      } 
      
      if(account.account_type_id === TITLE) { 
        insertAccount.accounts = [];
        
        //FIXME Grouping and totaling
        insertAccount.detail.total = {};
        tableDefinition.columns.forEach(function(column) { 
          insertAccount.detail.total[column.key] = 0; 
        });

        index[account.account_number] = insertAccount;

        if(account.parent === ROOT) { 
          store.push(insertAccount);
          return;
        }
        
        index[account.parent].accounts.push(insertAccount);
        return;
      }
      
      index[account.parent].accounts.push(insertAccount); 

      //FIXME Grouping and totaling
      updateTotal(account, index); 
    });
  }
  
  //TODO Total could be determined by inversing the sort and traversing the list linearly 
  function updateTotal(account, index) { 
    var parent = index[account.parent];
    while(parent) { 
      tableDefinition.columns.forEach(function(column) { 
        parent.detail.total[column.key] += account[column.key];
      });
      parent = index[parent.detail.parent];
    }
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

      //FIXME very cheeky - calculate this with SQL
      
    }); 
  }
 
  //TODO settupTable, toggleColumn, pushColumn and popColumn all improved and encapsulated within Table object, numColumns = 2, col 1 - budget, col 2 - realisation
  function settupTable(columnData) { 
    columnData.forEach(function(year, index) { 
      var tableOption = {active: false, id: year, index: index};
      tableDefinition.options.push(tableOption);
      toggleColumn(tableOption); 
    });
  }
  
  function toggleColumn(yearOption) { 
    var active = yearOption.active = !yearOption.active;
    if(active) return pushColumn(yearOption);     
    popColumn(yearOption);
  }
  
  //TODO Index relies on number of columns per iteration, this shouldn't be hardcoded
  function pushColumn(year) { 
    tableDefinition.columns.splice(year.index * 2, 0, {id: year.id, name: "Year " + year.id + " Budget", key: "budget_" + year.id});
    tableDefinition.columns.splice(year.index * 2, 0, {id: year.id, name: "Year " + year.id + " Realisation", key: "realisation_" + year.id});
  }

  function popColumn(year) { 

    //Avoid replacing the entire array, redrawing the DOM
    tableDefinition.columns.forEach(function(column, index) {
      if(column.id === year.id) tableDefinition.columns.splice(index, 2);
    });
  }

  function printReport() { print(); } 
 
  $scope.toggleYear = toggleColumn;
  $scope.printReport = printReport;
  $scope.tableDefinition = tableDefinition;

  $scope.financeGroups = financeGroups;
});
