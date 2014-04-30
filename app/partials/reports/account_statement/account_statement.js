angular.module('kpk.controllers').controller('accountStatement',
[
  '$scope',
  '$q',
  '$http',
  'appstate',
  'uuid',
  function ($scope, $q, $http, appstate, uuid) {
    var dependencies = {};
  
    var session = $scope.session = {
      dateFrom : '2014-03-03',
      dateTo : '2014-04-30',
      limit : 20
    };

    // TODO Receive this through $routeParams
    var accountId = 1062;

    // Temporary details not yet stored
    var accountCreated = '03-03-2014';
  
    dependencies.report = {
      // query : '/report/account_statement/'
    };

    processProject()
    .then(
      processReport
    ).then(
      initialise
    );

    function initialise(model) {
      console.log('[accountStatement]', 'fetched report', model); 
      $scope.report = model.data;

      $scope.report.timestamp = new Date();
      $scope.report.uuid = uuid();
      $scope.report.account.created = new Date(accountCreated);

      processItemBalance($scope.report);
    }

    function processItemBalance(model) {
      var beginBalance = model.balance.balance;
      var tempBalance = 0;

      // console.log(model.detail);

      // model.detail.sort();

      console.log(model.detail);

      model.detail.forEach(function (item) {
        beginBalance += (item.debit_equiv - item.credit_equiv);
        item.balance = beginBalance;
        tempBalance += (item.debit_equiv - item.credit_equiv);
        
        item.inv_po_id = item.inv_po_id.slice(0, 6);
      });

      console.log(tempBalance);
    }
    
    function processReport() {
      var statementParams = {
        dateFrom : session.dateFrom,
        dateTo : session.dateTo,
        order : 'date',
        limit : session.limit,
        accountId : accountId
      };

      dependencies.report.query =
        '/reports/accountStatement/?' +
        JSON.stringify(statementParams);

      return $http.get(dependencies.report.query);
    }

    function processProject() {
      var deferred = $q.defer();
      
      appstate.register('project', function (result) {
        $scope.project = result;
        deferred.resolve(result);
      });
      return deferred.promise;
    }
     
  }
]);
