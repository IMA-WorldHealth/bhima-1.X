angular.module('kpk.controllers')
.controller('allTransactions', [
  '$scope',
  'connect',
  'appstate',
  'messenger',
  '$filter',
  'validate',
  'kpkUtilitaire',
  function ($scope, connect, appstate, messenger, $filter, validate, util) {

    //variables inits

    var dependencies = {};

    dependencies.accounts = {
      required : true,
      query : {
        tables : {'account' : {columns : ["id", "account_number", "account_txt", "account_type_id"]}}
      }
    }

    $scope.dates = {}; $scope.state = {}; $scope.account = {}, $scope.model = {};
    $scope.model.sources = [$filter('translate')('SELECT.ALL'), $filter('translate')('SELECT.POSTING_JOURNAL'), $filter('translate')('SELECT.GENERAL_LEDGER')];


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
    }

    function handlError (err){
      //console.log('error');
      //
    }

    function fill (){
     // var f = (account_id && account_id != 0)? selective(account_id) : all ();
     if (!$scope.model.account_id) {
        all();
     }
    }

    function selective (){
      $scope.mode = 'selected';
      var qo = {
        source : $scope.model.source_id,
        enterprise_id : $scope.enterprise.id,
        account_id : $scope.model.account_id,
        datef : $scope.dates.from,
        datet : $scope.dates.to
      };

      $scope.model.account_number = $scope.accounts.data.filter(function(value){
        return value.id == $scope.model.account_id;
      })[0].account_number;

      connect.MyBasicGet(
        '/reports/allTrans/?'+JSON.stringify(qo)
      ).then(function(res){
          if(res.length > 0){
            $scope.records = res;
          }else{
            $scope.records = [];
          }
      })
    }

    function all () {
      $scope.mode = 'all';
      var qo = {
        source : $scope.model.source_id,
        enterprise_id : $scope.enterprise.id,
        account_id : 0,
        datef : $scope.state.from,
        datet : $scope.state.to
      };
      connect.MyBasicGet(
        '/reports/allTrans/?'+JSON.stringify(qo)
      ).then(function(res){
          if(res.length > 0){
            $scope.records = res;
          }else{
            $scope.records = [];
          }
        })
    }

    function dateWatcher () {
      // $scope.state.from = $filter('date')($scope.dates.from, 'yyyy-MM-dd');
      // $scope.state.to = $filter('date')($scope.dates.to, 'yyyy-MM-dd');
      $scope.state.from = util.convertToMysqlDate($scope.dates.from);
      $scope.state.to = util.convertToMysqlDate($scope.dates.to);
    }

    function search (){
      if(!$scope.model.account_id) return;
      ($scope.model.account_id != 0)?$scope.mode = 'selected' : $scope.mode = 'all';
      var qo = {
        source : $scope.model.source_id,
        enterprise_id : $scope.enterprise.id,
        account_id : $scope.model.account_id,
        datef : $scope.state.from,
        datet : $scope.state.to
      };

      if($scope.model.account_id && $scope.model.account_id == 0){
        $scope.model.account_number = "Tous"
      }else{
         $scope.model.account_number = $scope.accounts.data.filter(function(value){
          return value.id == $scope.model.account_id;
        })[0].account_number;
      }  

      connect.MyBasicGet(
        '/reports/allTrans/?'+JSON.stringify(qo)
      ).then(function(res){
          if(res.length > 0){
            $scope.records = res;
          }else{
            $scope.records = [];
          }
      })


    }


    //invocations

    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      $scope.dates.from = new Date();
      $scope.dates.to = new Date();
      dependencies.accounts.query.where = ['account.enterprise_id='+enterprise.id];
      validate.process(dependencies).then(init, handlError);
    });
    
    $scope.$watch('dates', dateWatcher, true);
   // $scope.$watch('state', stateWatcher, true);
    $scope.$watch('model.account_id', fill);   


    //expositions

    $scope.formatAccount = formatAccount;
    $scope.search = search;



    // $scope.state = {};
    // $scope.dates = {};



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
