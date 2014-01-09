angular.module('kpk.controllers').controller('accountsReport', function($scope, $q, connect, messenger) { 
  console.log('accountReport controller initialised');
  
  $scope.model = {};
  var accountsQuery = { 
    tables: { 
      'account': { 
        columns: ["id", "account_txt", "account_number"]
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
    fetchRequests()
    .then(function(res) { 
      messenger.push({type: 'success', msg: 'Fetched all accounts'});    
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

  accountsReport();
});
