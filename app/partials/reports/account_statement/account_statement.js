angular.module('kpk.controllers').controller('accountStatement',
[
  '$scope',
  '$q',
  '$http',
  '$routeParams',
  '$translate',
  'appstate',
  'uuid',
  'util',
  'messenger',
  function ($scope, $q, $http, $routeParams, $translate, appstate, uuid, util, messenger) {
    var dependencies = {};
    var session = $scope.session = {
      reportDate : new Date(),
      timestamp : new Date(),
      config : {
        limit : 25
      },
      loaded : false,
      select : false
    };
    session.config.dateFrom = util.convertToMysqlDate(session.reportDate);
    session.config.dateTo = session.config.dateFrom;

    dependencies.report = {
      // query : '/report/account_statement/'
    };
    
    parseParams();

    function parseParams() {
      session.requestId = $routeParams.id;

      if (!session.requestId) return session.select = true;
      return fetchReport(session.requestId);
    }

    function fetchReport(accountId) {
      session.config.accountId = accountId;

      processProject()
      .then(
        processReport
      ).then(
        initialise
      ).catch(
        handleError
      );
    }
    
    function initialise(model) {
      session.loaded = true;
      session.select = false;

      $scope.report = model.data;
      $scope.report.uuid = uuid();
    }

    function processReport() {
      var statementParams = {
        dateFrom : session.config.dateFrom,
        dateTo : session.config.dateTo,
        order : 'date',
        limit : session.config.limit,
        accountId : session.config.accountId
      };

      dependencies.report.query =
        '/reports/accountStatement/?' +
        JSON.stringify(statementParams);
    
      console.log('requesting', statementParams);
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

    function handleError(error) {
      messenger.danger($translate('REPORT.ACCOUNT_STATEMENT.CANNOT_FIND_ACCOUNT') + ' ' + session.requestId);
      session.loaded = false;
      session.select = true;
      throw error; 
    }

    function requestAccount(accountId) {
      if (accountId) fetchReport(accountId);
      console.log('requestId', accountId);
    }

    $scope.requestAccount = requestAccount;
  }
]);
