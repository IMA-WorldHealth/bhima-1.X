angular.module('bhima.controllers')
.controller('expiring', [
  '$scope',
  'connect',
  'appstate',
  'messenger',
  '$filter',
  'validate',
  'util',
  '$q',
  function ($scope, connect, appstate, messenger, $filter, validate, util, $q) {

    $scope.options = [
      {
        label : 'EXPIRING.DAY',
        fn : day,
      },
      {
        label : 'EXPIRING.WEEK',
        fn : week,
      },
      {
        label : 'EXPIRING.MONTH',
        fn : month
      }
    ]

    $scope.selected = null;
    var dependencies = {};

    dependencies.depots = {
      required: true,
      query : {
        tables : {
          'depot' : {
            columns : ['uuid', 'text', 'reference', 'enterprise_id']
          }
        }
      }
    }

    var session = $scope.session = {};

    function search (selection) {
      session.selected = selection.label;
      selection.fn();
    }

    function day () {
      session.dateFrom = new Date();
      session.dateTo = new Date();
      formatDates();
      $scope.configuration = getConfiguration();
      doSearching();
    }

    function week () {
      session.dateFrom = new Date();
      session.dateFrom.setDate(session.dateFrom.getDate() - session.dateFrom.getDay());
      session.dateTo = new Date(session.dateFrom.getTime()+(6*3600000));
      formatDates();
      $scope.configuration = getConfiguration();
      doSearching();
    }

    function month () {
      session.dateFrom = new Date();
      session.dateTo = new Date();
      session.dateFrom.setDate(1);
      formatDates();
      $scope.configuration = getConfiguration();
      doSearching();
    }

    function formatDates () {
      session.dateFrom = $filter('date')(session.dateFrom, 'yyyy-MM-dd');
      session.dateTo = $filter('date')(session.dateTo, 'yyyy-MM-dd');
    }

    function doSearching (p){
      if(p && p===1) $scope.configuration =getConfiguration();
      console.log('configuration', $scope.configuration);
      connect.fetch('expiring/'+$scope.configuration.depot_uuid+'/'+$scope.configuration.df+'/'+$scope.configuration.dt)
      .then(complete)
      .then(extendData)
      .catch(function(err){
      })
    }

    function complete (models){
      $scope.uncompletedList = models;
      return $q.all(models.map(function (m){
        return connect.fetch('expiring_complete/'+m.inventory_uuid);
      }))
    }

    function extendData (results){
      results.forEach(function (item, index){
        if(!$scope.uncompletedList[index].consumed) $scope.uncompletedList[index].consumed = 0;
        $scope.uncompletedList[index].text = item[0].text;
      })
      $scope.configuration.expirings = $scope.uncompletedList;
    }

    function fillReport (res){
    }

    function handleError (){
    }

    function init (model){
      $scope.model = model;
      session.depot = '*';
      search($scope.options[0]);
      $scope.configuration = getConfiguration();
      doSearching();
    }

    function getConfiguration (){
      return {
        depot_uuid : session.depot,
        df         : session.dateFrom,
        dt         : session.dateTo
      }
    }

    appstate.register('enterprise', function(enterprise){
      $scope.enterprise = enterprise;
      dependencies.depots.where=['depots.enterprise_id='+$scope.enterprise.id];
      validate.process(dependencies)
      .then(init)
    });

    $scope.search = search;
    $scope.doSearching = doSearching;


  }
]);
