angular.module('bhima.controllers')
.controller('stock.distribution_service', [
  '$scope',
  '$q',
  '$routeParams',
  '$location',
  'validate',
  'connect',
  'messenger',
  'util',
  'uuid',
  function ($scope, $q, $routeParams, $location, validate, connect, messenger, util, uuid) {
    var session = $scope.session = {
      depot : $routeParams.depotId,
      isServiceSelected : false
    }

    var configuration = $scope.configuration = {}
    var dependencies = {}
    dependencies.services = {
      query : {
        tables : {
          'service' : {
            columns : ['id', 'name', 'cost_center_id']
          }
        }
      }
    }

    dependencies.depots = {
      query : {
        tables : {
          'depot' : {
            columns : ['uuid', 'reference', 'text', 'enterprise_id']
          }
        },
        where : ['depot.uuid='+session.depot]
      }
    }

    dependencies.avail_stocks = {
      identifier:'tracking_number',
      query : '/serv_dist_stock/' + session.depot
    }

    validate.process(dependencies).then(initialisation)

    function initialisation (model) {
      console.log('le model est la ', model);
      $scope.model = model
      configuration.rows = [new DistributionRow(), new DistributionRow()]

    }

    function preparDistribution () {
      session.isServiceSelected = true
      $scope.model.uuid = uuid()
      $scope.model.date = util.convertToMysqlDate(new Date())
      $scope.model.depot_name = $scope.model.depots.data[0].text
    }

    function DistributionRow (){
      this.designation = null
      this.lot = null
      this.price = null
      this.quantity = null
      return this
    }

    function addRow () {
      configuration.rows.push(new JournalRow());
    };

    function removeRow (index) {
      configuration.rows.splice(index, 1);
    };

    $scope.preparDistribution = preparDistribution
    $scope.addRow = addRow
     $scope.removeRow = removeRow
}]);
