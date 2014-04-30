angular.module('kpk.controllers').controller('accountStatement',
[
  '$scope',
  '$q',
  '$http',
  'appstate',
  'uuid',
  function ($scope, $q, $http, appstate, uuid) {
    var dependencies = {};

    // TODO Receive this through $routeParams
    var accountId = 1062;

    // Temporary details not yet stored
    var accountCreated = '03-05-2014';
  
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
    }
    
    function processReport() {
      var statementParams = {
        dateFrom : '03-05-2014',
        dateTo : '05-30-2014',
        order : 'date',
        limit : 10,
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
