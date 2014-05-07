angular.module('kpk.controllers').controller('accountStatement',
[
  '$scope',
  '$q',
  '$http',
  '$routeParams',
  'appstate',
  'uuid',
  'util',
  function ($scope, $q, $http, $routeParams, appstate, uuid, util) {
    var dependencies = {};
    var accountId = $routeParams.id;
    var session = $scope.session = {
      reportDate : new Date(),
      timestamp : new Date(),
      config : {
        limit : 25
      }
    };
    session.config.dateFrom = util.convertToMysqlDate(session.reportDate);
    session.config.dateTo = session.config.dateFrom;

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
      $scope.report = model.data;
      $scope.report.uuid = uuid();
    }
    
    function processReport() {
      var statementParams = {
        dateFrom : session.config.dateFrom,
        dateTo : session.config.dateTo,
        order : 'date',
        limit : session.config.limit,
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
