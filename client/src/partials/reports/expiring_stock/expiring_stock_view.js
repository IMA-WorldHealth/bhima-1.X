angular.module('bhima.controllers')
.controller('expiring.option', [
  '$scope',
  '$q',
  '$routeParams',
  '$http',
  '$translate',
  'connect',
  'appstate',
  'validate',
  'messenger',
  'util',
  function ($scope, $q, $routeParams, $http, $translate, connect, appstate, validate, messenger, util) {
    var session = $scope.session = {};
    var dependencies = {};

    session.expiring_option = $routeParams.option;
    session.dateFrom = new Date();
    session.dateTo = new Date();

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
    ];

    $scope.selected = null;

    dependencies.depots = {
      required: true,
      query : {
        tables : {
          'depot' : {
            columns : ['uuid', 'text', 'reference', 'enterprise_id']
          }
        }
      }
    };


    function search (selection) {
      session.selected = selection.label;
      selection.fn();
    }

    function day () {
      session.dateFrom = new Date();
      session.dateTo = new Date();
      $scope.configuration = getConfiguration();
      doSearching();
    }

    function week () {
      session.dateFrom = new Date();
      session.dateFrom.setDate(session.dateFrom.getDate() - session.dateFrom.getDay());
      session.dateTo = new Date(session.dateFrom.getTime()+(6*3600000));
      $scope.configuration = getConfiguration();
      doSearching();
    }

    function month () {
      session.dateFrom = new Date();
      session.dateTo = new Date();
      session.dateFrom.setDate(1);
      $scope.configuration = getConfiguration();
      doSearching();
    }

    function doSearching (p) {
      if (p && p===1) {
        $scope.configuration = getConfiguration();
      }

      var dateFrom = util.sqlDate($scope.configuration.df),
          dateTo = util.sqlDate($scope.configuration.dt);

      //connect.fetch('expiring/'+$scope.configuration.depot_uuid+'/'+dateFrom+'/'+dateTo)
      expiringCase(session.expiring_option)
      .then(complete)
      .then(extendData)
      .catch(function (err) {
        messenger.danger(err);
      });
    }

    function expiringCase (option) {
      var def = $q.defer(), obj = {};

      $scope.label = $translate.instant('EXPIRING.TITLE');

      switch(option){
        case 'expired' : 
          $scope.label = $translate.instant('EXPIRING.EXPIRED');
          $http.get('/getExpiredTimes/',{params : {
                'request' : 'expired'
              }  
          }).
          success(function(data) { obj = data; def.resolve(obj); }); 
        break;

        case 'expired30' : 
          $scope.label = $translate.instant('EXPIRING.EX_30');
          $http.get('/getExpiredTimes/',{params : {
                'request' : 'expiredDellai',
                'inf'     : '0',
                'sup'     : '30'
              }  
          }).
          success(function(data) { obj = data; def.resolve(obj); });
        break;

        case 'expired90' : 
          $scope.label = $translate.instant('EXPIRING.EX_90');
          $http.get('/getExpiredTimes/',{params : {
                'request' : 'expiredDellai',
                'inf'     : '30',
                'sup'     : '90'
              }  
          }).
          success(function(data) { obj = data; def.resolve(obj); });
        break;

        case 'expired180' : 
          $scope.label = $translate.instant('EXPIRING.EX_180');
          $http.get('/getExpiredTimes/',{params : {
                'request' : 'expiredDellai',
                'inf'     : '90',
                'sup'     : '180'
              }  
          }).
          success(function(data) { obj = data; def.resolve(obj); });
        break;

        case 'expired365' : 
          $scope.label = $translate.instant('EXPIRING.EX_365');
          $http.get('/getExpiredTimes/',{params : {
                'request' : 'expiredDellai',
                'inf'     : '180',
                'sup'     : '365'
              }  
          }).
          success(function(data) { obj = data; def.resolve(obj); });
        break;

        case 'oneYear' : 
        $scope.label = $translate.instant('EXPIRING.EX_YEAR');
          $http.get('/getExpiredTimes/',{params : {
                'request' : 'oneYear'
              }  
          }).
          success(function(data) { obj = data; def.resolve(obj); });
        break;

        default :
          var dateFrom = util.sqlDate($scope.configuration.df),
              dateTo = util.sqlDate($scope.configuration.dt);

          connect.fetch('expiring/'+$scope.configuration.depot_uuid+'/'+dateFrom+'/'+dateTo)
          .then(function (data) { obj = data; def.resolve(obj); });
        break;
      }

      return def.promise;
    }

    function complete (models) {
      $scope.uncompletedList = models;
      return $q.all(models.map(function (m) {
        return connect.fetch('expiring_complete/'+m.tracking_number+'/'+$scope.configuration.depot_uuid);
      }));
    }

    function cleanEnterpriseList () {
      return $scope.uncompletedList.map(function (item) {
        return {
          tracking_number  : item.tracking_number,
          lot_number       : item.lot_number,
          text             : item.text,
          expiration_date  : item.expiration_date,
          quantity         : item.quantity
        };
      });
    }

    function cleanDepotList () {
      return $scope.uncompletedList.map(function (item) {
        return {
          tracking_number : item.tracking_number,
          lot_number      : item.lot_number,
          text            : item.text,
          expiration_date : item.expiration_date,
          quantity         : item.quantity
        };
      });

    }

    function extendData (results) {
      results.forEach(function (item, index) {
        $scope.uncompletedList[index].consumed = item[0].consumed;
        if (!$scope.uncompletedList[index].consumed) {
          $scope.uncompletedList[index].consumed = 0;
        }
      });

      $scope.configuration.expirings = $scope.configuration.depot_uuid === '*' ?
        cleanEnterpriseList() :
        cleanDepotList();
    }

    function init (model) {
      $scope.model = model;
      session.depot = '*';
      search($scope.options[0]);
      $scope.configuration = getConfiguration();
      doSearching();
    }

    function getConfiguration () {
      return {
        depot_uuid : session.depot,
        df         : session.dateFrom,
        dt         : session.dateTo
      };
    }

    appstate.register('enterprise', function(enterprise) {
      $scope.enterprise = enterprise;
      dependencies.depots.where =
        ['depots.enterprise_id=' + enterprise.id];
      validate.process(dependencies)
      .then(init);
    });

    $scope.search = search;
    $scope.doSearching = doSearching;
  }
]);
