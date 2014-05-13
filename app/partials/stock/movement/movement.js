angular.module('kpk.controllers')
.controller('stock.movement', [
  '$scope',
  '$location',
  '$routeParams',
  'validate',
  'appstate',
  'connect',
  'messenger',
  'uuid',
  function ($scope, $location, $routeParams, validate, appstate, connect, messenger, uuid) {
    var dependencies = {};
    var session = $scope.session = { doc : {}, rows : [] };

    if (!angular.isDefined($routeParams.depotId)) {
      messenger.danger('ERR_NO_DEPOT');
    }


    dependencies.depots = {
      query : {
        tables : {
          'depot' : {
            columns : ['id', 'text']
          }
        }
      }
    };

    dependencies.movements = {
      query : {
        tables : {
          'stock_movement' : {
            columns : ['document_id', 'tracking_number', 'direction', 'date', 'quantity', 'depot_id', 'destination']
          }
        }
      }
    };

    dependencies.stock = {
      query : {
        tables : {
          'stock' : {
            columns : ['tracking_number']
          }
        },
        where : ['stock.quantity>0']
      }
    };


    function initialise(project) {
      $scope.project = project;
      dependencies.depots.query.where =
        ['depot.enterprise_id=' + project.enterprise_id];

      validate.process(dependencies, ['depots', 'stock'])
      .then(startup)
      .catch(error);
    }

    function error (err) {
      messenger.error(err);
    }

    function startup (models) {
      angular.extend($scope, models);
      
      session = $scope.session = { doc: {}, rows : [] };
      session.doc.document_id = uuid();
      session.doc.depot_id = $routeParams.depotId;
      session.doc.date = new Date();


      session.depot = $scope.depots.get($routeParams.depotId);
      
      session.depotFrom = session.depot;
      $scope.addRow();

    }
    
    $scope.addRow = function addRow () {
      session.rows.push({quantity : 0, destination : ''});
    };

    $scope.removeRow = function (idx) {
      session.rows.splice(idx, 1);
    };

    $scope.submit = function () {
      var rows = [];
      session.rows.forEach(function (row) {
        rows.push(angular.extend(row, session.doc));
      });

      connect.basicPut('stock_movement', rows)
      .then(function (res) {
        messenger.success('STOCK.MOVEMENT.SUCCESS');
      })
      .catch(function (err) {
        messenger.error(err);
      });
    };

    $scope.$watch('session', function () {
      if (!session.rows) {
        session.valid = false;
        return;
      }

      var validRows = session.rows.every(function (item) {
        return angular.isDefined(item.tracking_number) &&
          angular.isDefined(item.quantity) &&
          item.quantity > 0 &&
          angular.isDefined(item.destination);
      });

      session.valid = validRows &&
        angular.isDefined(session.doc.document_id) &&
        angular.isDefined(session.doc.date) &&
        angular.isDefined(session.doc.depot_id) &&
        angular.isDefined(session.doc.direction);

    }, true);

    appstate.register('project', initialise);
  }
]);
