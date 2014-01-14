angular.module('kpk.controllers').controller('accountsReport', function($scope, $q, connect, messenger, appstate) { 
  console.log('accountReport controller initialised');
  
  //Parse all accounts - add depth level etc. apply styling based on this
  $scope.model = {};
  var accountsQuery = { 
    identifier: 'account_number',
    tables: {
      'account': { 
        columns: ["id", "account_txt", "account_number", "parent", "account_type_id"]
      }
    }
  }
  
  var dependencies = ['account'], requests = {};
  requests['account'] = { 
    query: accountsQuery,
    required: true,
    model: null
  }

  function accountsReport() { 

    //fetch meta data
    appstate.register('enterprise', function(res) { 
      $scope.enterprise = res;
      $scope.timestamp = new Date();
    });

    fetchRequests()
    .then(function(res) { 
      messenger.push({type: 'success', msg: 'Fetched all accounts'}); 
      parseAccountDepth($scope.model['account'].data);
    });
  }

  function fetchRequests() { 
    var promiseList = [], deferred = $q.defer();
    
    dependencies.forEach(function(key) { 
      promiseList.push(connect.req(requests[key].query)); 
    });

    $q.all(promiseList)
    .then(function(res) { 
      dependencies.forEach(function(key, index) { 
        requests[key].model = res[index];
        $scope.model[key] = requests[key].model;
      });
      deferred.resolve();
    });
    return deferred.promise; 
  } 

  function parseAccountDepth(accounts) { 
    var ROOT_NODE = 0; 
    
    accounts.forEach(function(account) { 
      var parent, depth;

      //TODO if parent.depth exists, increment and kill the loop (base case is ROOT_NODE)
      parent = $scope.model['account'].get(account.parent);
      depth = 0;
      while(parent) { 
        depth++;
        parent = $scope.model['account'].get(parent.parent);
      }
      account.depth = depth;
    });
  }
  accountsReport();
});
