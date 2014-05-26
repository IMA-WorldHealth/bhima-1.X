angular.module('bhima.controllers')
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
   
    // TODO Warnings, only one depot, zero depots?
    // TODO Improve data verification
    // TODO Receipts
    
    var dependencies = {};
    var session = $scope.session = {
      configured : false,
      invalid : false,
      doc : {},
      rows : [],
    };
    var depotMap = $scope.depotMap = {
      from : {
        model : {},
        dependency : 'to',
        action : fetchLots
      },
      to : {
        model : {},
        dependency : 'from',
        action : null
      }
    };
  
    // This doesn't match the route, it should never happen
    /*if (!angular.isDefined($routeParams.depotId)) {
       messenger.danger('ERR_NO_DEPOT');
    }*/

    dependencies.depots = {
      query : {
        identifier : 'uuid',
        tables : {
          'depot' : {
            columns : ['uuid', 'reference', 'text']
          }
        }
      }
    };

    // dependencies.movements = {
    //   query : {
    //     tables : {
    //       'stock_movement' : {
    //         columns : ['document_id', 'tracking_number', 'direction', 'date', 'quantity', 'depot_uuid', 'destination']
    //       }
    //     }
    //   }
    // };

    // dependencies.stock = {
    //   query : {
    //     tables : {
    //       'stock' : {
    //         columns : ['tracking_number']
    //       }
    //     },
    //     where : ['stock.quantity>0']
    //   }
    // };

    function initialise(project) {
      $scope.project = project;
      dependencies.depots.query.where =
        ['depot.enterprise_id=' + project.enterprise_id];

      validate.process(dependencies, ['depots'])
      .then(startup)
      .catch(error);
    }
     
    function selectDepot(target, newDepotId, oldDepot) {
      var reference = depotMap[target];
      var source = reference.model;
      var dependency = depotMap[reference.dependency].model;
      
      // Update current target
      session[target] = source.get(newDepotId);
      
      // Remove value from dependency
      dependency.remove(newDepotId);
      if (oldDepot) dependency.post(oldDepot);
      dependency.recalculateIndex();

      // Call targets action (this could be conditional)
      reference.action(newDepotId);
    }

    function fetchLots(depotId) {
      dependencies.lots = {
        query : '/inventory/depot/' + depotId + '/lots'
      };

      console.log('fetch lots', dependencies.lots); 
      validate.process(dependencies, ['lots']).then(validateLots);
    }

    function validateLots(model) {
      console.log('validateLots', model);
    }
    
    Object.keys(depotMap).forEach(function (key) {
      $scope.$watch('session.' + key, function(nval, oval) {
        if (nval) selectDepot(key, nval.uuid, oval);
      }, false);
    });

    function error (err) {
      messenger.error(err);
    }

    function startup (models) {
      var validDepo = models.depots.get($routeParams.depotId);
      if (!validDepo) return session.invalid = true;
  

      session.configured = true;
      angular.extend($scope, models);
      
      session.doc.document_id = uuid();
      session.doc.date = new Date();

      session.depot = validDepo;
      depotMap.from.model = angular.copy($scope.depots);
      depotMap.to.model = angular.copy($scope.depots);
      
      // Assign default location 
      selectDepot('from', session.depot.uuid);
      
      $scope.addRow();
    }

    function updateDocumentDepo() {
      session.doc.depot_exit = session.depotFrom.uuid;
      session.doc.depot_entry = session.depotTo.uuid;
    }
    
    $scope.addRow = function addRow () {
      session.rows.push({quantity : 0});
    };

    $scope.removeRow = function (idx) {
      session.rows.splice(idx, 1);
    };

    $scope.submit = function () {
      var rows = [];

      updateDocumentDepo();
      session.rows.forEach(function (row) {
        var item = angular.extend(row, session.doc);

        rows.push(item);
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
        angular.isDefined(session.doc.depot_uuid) &&
        angular.isDefined(session.doc.direction);

    }, true);

    appstate.register('project', initialise);

  }
]);
