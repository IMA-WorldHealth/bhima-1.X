angular.module('bhima.controllers')
.controller('primary_cash.incomeReport', [
  '$scope',
  '$q',
  'connect',
  'appstate',
  'validate',
  'messenger',
  'util',
  function ($scope, $q, connect, appstate, validate, messenger, util) {
    var session = $scope.session = {};
    var dependencies = {};

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


    function doSearching (p) {
      if (p && p===1) {
        $scope.configuration = getConfiguration();
      }

      var dateFrom = util.sqlDate($scope.configuration.df),
          dateTo = util.sqlDate($scope.configuration.dt);

      connect.fetch('expiring/'+$scope.configuration.depot_uuid+'/'+dateFrom+'/'+dateTo)
      .then(complete)
      .then(extendData)
      .catch(function (err) {
        messenger.danger(err);
      });
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
          initial          : item.initial,
          current          : item.initial - item.consumed
        };
      });
    }

    function cleanDepotList () {
      console.log('voici la liste a soigner : ', $scope.uncompletedList);
      return $scope.uncompletedList.map(function (item) {
        return {
          tracking_number : item.tracking_number,
          lot_number      : item.lot_number,
          text            : item.text,
          expiration_date : item.expiration_date,
          initial         : item.initial,
          current         : item.current
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

    // appstate.register('enterprise', function(enterprise) {
    //   $scope.enterprise = enterprise;
    //   dependencies.depots.where =
    //     ['depots.enterprise_id=' + enterprise.id];
    //   validate.process(dependencies)
    //   .then(init);
    // });

  }
]);
