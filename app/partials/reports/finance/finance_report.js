angular.module('kpk.controllers').controller('reportFinance', function($scope, $q, connect, appstate, validate) {
  var dependencies = {}, reportYears = [];

  dependencies.finance = { 
    required : true,
    identifier: "account_number",
    query : '/reports/finance/?' + JSON.stringify({fiscal: [1, 2]}),
    KPKAPIHISRequest : false
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
    parseAccountDepth($scope.model['finance']);
    settupTable(reportYears);
  }

  function settupTable(columnData) { 
    var columnDefinition = [];
    columnData.forEach(function(year) { 
      if(year.toggle) columnDefinition.push({id: year.id, name: "Year " + year.id + " Budget", key: "budget_" + year.id});
      if(year.toggle) columnDefinition.push({id: year.id, name: "Year " + year.id + " Realisation", key: "realisation_" + year.id});
    });
    $scope.columnDefinition = columnDefinition;
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

  function ReportYears() { 
   
    //Toggle must remove clumns from table column definition, ordering must be accounted for 
    function toggle(year) { 
      year.toggle = !year.toggle;
    }
  } 
  
  $scope.basicPrint = function basicPrint() { 
    print();
  };
});
