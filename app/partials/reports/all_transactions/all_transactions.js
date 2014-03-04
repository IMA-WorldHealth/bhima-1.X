angular.module('kpk.controllers')
.controller('allTransactions', [
  '$scope',
  'connect',
  'appstate',
  'messenger',
  '$filter',
  'validate',
  function ($scope, connect, appstate, messenger, $filter, validate) {

    //variables inits

    var dependencies = {};

    dependencies.accounts = {
      required : true,
      query : {
        tables : {'account' : {columns : ["id", "account_number", "account_txt", "account_type_id"]}}
      }
    }

    $scope.dates = {}; $scope.account = {};


    //fonctions

    function formatAccount (account){
      return [
        account.account_number, account.account_txt
      ].join(' -- ');
    }

    function init (model){
      for(var k in model) $scope[k] = model[k];
      $scope.accounts.data.forEach(function (account) {
        account.account_number = String(account.account_number);
      });

      //fill();
    }

    function handlError (err){
      //console.log('error');
      //
    }

    function fill (account_id){
      var f = (account_id && account_id !== 0)? selective(account_id) : all ();
    }

    function selective (){
      console.log('selective');
    }

    function all (){
      var qo = {
        source : 'posting_journal',
        enterprise_id : $scope.enterprise.id,
        account_id : $scope.account.id,
        datef : $scope.dates.from,
        datet : $scope.dates.to
      };
      connect.MyBasicGet(
        '/reports/allTrans/?'+JSON.stringify(qo)
      ).then(function(res){
          console.log('ici on a res :', res);
        })
    }


    //invocations

    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      $scope.dates.dateFrom = new Date();
      $scope.dates.dateTo = new Date();
      dependencies.accounts.query.where = ['account.enterprise_id='+enterprise.id, 'AND', 'account_type_id<>'+3];
      validate.process(dependencies).then(init, handlError);
    });

    $scope.$watch('account.id', fill);


    //expositions

    $scope.formatAccount = formatAccount;




    // $scope.state = {};
    // $scope.dates = {};

    // function dateWatcher () {
    //   $scope.state.dateFrom = $filter('date')($scope.dates.dateFrom, 'yyyy-MM-dd');
    //   $scope.state.dateTo = $filter('date')($scope.dates.dateTo, 'yyyy-MM-dd');
    // }

    // function stateWatcher () {
    //   $scope.dates.dateFrom = new Date($scope.state.dateFrom);
    //   $scope.dates.dateTo = new Date($scope.state.dateTo);
    // }

    //$scope.$watch('dates', dateWatcher, true);
    //$scope.$watch('state', stateWatcher, true);

    // appstate.register('enterprise', function (enterprise) {
    //   $scope.enterprise = enterprise;
    //   $scope.dates.dateFrom = new Date();
    //   $scope.dates.dateTo = new Date();
    //   $scope.day();
    // });

    // $scope.day = function day () {
    //   $scope.dates.dateFrom = new Date();
    //   $scope.dates.dateTo = new Date();
    //   $scope.search();
    // };

    // $scope.week = function week () {
    //   $scope.dates.dateFrom = new Date();
    //   $scope.dates.dateTo = new Date();
    //   $scope.dates.dateFrom.setDate($scope.dates.dateTo.getDate() - 7);
    //   $scope.search();
    // };

    // $scope.month = function month () {
    //   $scope.dates.dateFrom = new Date();
    //   $scope.dates.dateTo = new Date();
    //   $scope.dates.dateFrom.setMonth($scope.dates.dateTo.getMonth() - 1);
    //   $scope.search();
    // };

    // $scope.search = function search () {
    //   // must add a day to pick it up from sql
    //   var dateConvert = $scope.dates.dateTo;
    //   dateConvert.setDate(dateConvert.getDate() + 1);
    //   dateWatcher();
    //   connect.fetch([
    //     '/rt/p',
    //     $scope.enterprise.id,
    //     $scope.state.dateFrom,
    //     $scope.state.dateTo
    //   ].join('/'))
    //   .success(function (model) {
    //     $scope.patients = model;
    //   })
    //   .error(function (err) {
    //     messenger.danger('An error occured:' + JSON.stringify(err));
    //   });
    // };

  }
]);
