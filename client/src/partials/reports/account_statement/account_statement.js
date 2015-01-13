angular.module('bhima.controllers')
.controller('accountStatement', [
  '$scope',
  '$q',
  '$http',
  '$routeParams',
  '$translate',
  'appstate',
  'uuid',
  'util',
  'messenger',
  '$window',
  'validate',
  function ($scope, $q, $http, $routeParams, $translate, appstate, uuid, util, messenger, $window, validate) {
    var dependencies = {};
    var session = $scope.session = {
      reportDate : new Date(),
      timestamp : new Date(),
      config : {
        limit : 10,
	accountId : null
      },
      loaded : false,
      select : false
    };
    session.config.dateFrom = new Date();
    session.config.dateTo = new Date();

    dependencies.accounts = {
      query : {
        tables : {
          'account' :{
            columns : ['id', 'account_txt', 'account_number']
          }
        }
      }
    };

    appstate.register('project', function (project) {
      $scope.project = project;
      validate.process(dependencies)
      .then(init, handleError);
    });

    function init(models) {
      angular.extend(session, models);
    }


    // Define the callbacks for the findAccount dialog
    function submitAccount(account) {
      fetchReport(account.id);
    }

    function resetAccountSearch() {
      session.config.accountId = null;
    }


    function handleError(err) {
       messenger.danger($translate.instant('REPORT.ACCOUNT_STATEMENT.CANNOT_FIND_ACCOUNT') + ' ' + session.requestId);      
    }

    function fetchReport(accountId) {
      session.config.accountId = accountId;

      processReport()
        .then(
          initialise
        ).catch(
          handleError
        );
    }

    function processReport() {
      dependencies.report = {};
      var statementParams = {
        dateFrom : util.sqlDate(session.config.dateFrom),
        dateTo : util.sqlDate(session.config.dateTo),
        order : 'date',
        limit : angular.isNumber(session.config.limit)? session.config.limit : 10,
        accountId : session.config.accountId
      };

      dependencies.report.query =
        '/reports/accountStatement/?' +
        JSON.stringify(statementParams);   
      return $http.get(dependencies.report.query);
    }

    function initialise(model) {
      $scope.report = model.data;
      $scope.report.uuid = uuid();
    }


   
   
    // parseParams();

    // function parseParams() {
    //   session.requestId = $routeParams.id;

    //   if (!session.requestId) {
    //     session.select = true;
    //     return;
    //   }

    //   return fetchReport(session.requestId);
    // }

    

    // function processProject() {
    //   var deferred = $q.defer();
     
    //   appstate.register('project', function (result) {
    //     $scope.project = result;
    //     deferred.resolve(result);
    //   });
    //   return deferred.promise;
    // }

    // function handleError(error) {
    //   messenger.danger($translate.instant('REPORT.ACCOUNT_STATEMENT.CANNOT_FIND_ACCOUNT') + ' ' + session.requestId);
    //   session.loaded = false;
    //   session.select = true;
    //   throw error;
    // }


    function print () { $window.print(); }

    $scope.print = print;

    $scope.submitAccount = submitAccount;
    $scope.resetAccountSearch = resetAccountSearch;
  }
]);
