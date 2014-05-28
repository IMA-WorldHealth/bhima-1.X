angular.module('bhima.controllers')
.controller('expiring', [
  '$scope',
  'connect',
  'appstate',
  'messenger',
  '$filter',
  'validate',
  'util',
  function ($scope, connect, appstate, messenger, $filter, validate, util) {

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
    }

    function week () {
      session.dateFrom = new Date();
      session.dateTo = new Date();
      session.dateFrom.setDate(session.dateTo.getDate() - session.dateTo.getDay());
      console.log('voici notre nouveaux dates ', session.dateFrom, 'et', session.dateTo);
    }

    function month () {
      session.dateFrom = new Date();
      session.dateTo = new Date();
      session.dateFrom.setDate(1);
      console.log('voici notre nouveaux dates ', session.dateFrom, 'et', session.dateTo);
    }

    function formatDates () {
      session.dateFrom = $filter('date')(session.dateFrom, 'yyyy-MM-dd');
      session.dateTo = $filter('date')(session.dateTo, 'yyyy-MM-dd');
    }

    function doSearching (){
      formatDates();
    }

    function init (model){
      $scope.model = model;
      session.depot = '*';
      search($scope.options[0]);
      $scope.configuration = getConfiguration();
      console.log('et la configuration est ',$scope.configuration);
    }

    function getConfiguration (){
      return {
        depot_uuid : session.depot.uuid,
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
