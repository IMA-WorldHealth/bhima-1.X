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

    // dependencies.inventory = {
    //   identifier:'uuid',
    //   query : '/inv_in_depot/' + session.depot
    // }

    validate.process(dependencies)
    .then(complet)
    .then(extendData)
    .then(finalize)

    function complet (model) {
      $scope.model = model
      return $q.all(model.avail_stocks.data.map(function (stock) {
        return connect.fetch('expiring_complete/'+stock.tracking_number+'/'+session.depot);
      }))

    }

    function preparDistribution () {
      session.isServiceSelected = true
      $scope.model.uuid = uuid()
      $scope.model.date = util.convertToMysqlDate(new Date())
      $scope.model.depot_name = $scope.model.depots.data[0].text
    }

    function finalize () {
      $scope.model.inventory = filtrer($scope.model.avail_stocks.data, 'inventory_uuid');
      configuration.rows = [new DistributionRow()]
    }

    function DistributionRow (){
      this.code = null
      this.lots = null
      this.price = null
      this.quantity = 0
      this.validQuantity = false;
      return this
    }

    function addRow () {
      configuration.rows.push(new DistributionRow())
    };

    function removeRow (index) {
      configuration.rows.splice(index, 1)
    }

    function extendData (results) {
      results.forEach(function (item, index) {
        if (!item[0].consumed) {
          $scope.model.avail_stocks.data[index].consumed = 0
        }else{
          $scope.model.avail_stocks.data[index].consumed = item[0].consumed
        }
      });
      $scope.model.avail_stocks.data = $scope.model.avail_stocks.data.filter(function (item){
        return (item.entered - item.consumed - item.moved) > 0
      });
      $q.when();
    }

    function filtrer (items, filterOn) {

        if (filterOn === false) {
          return items;
        }

        if ((filterOn || angular.isUndefined(filterOn)) && angular.isArray(items)) {
          var hashCheck = {}, newItems = [];

          var extractValueToCompare = function (item) {
            if (angular.isObject(item) && angular.isString(filterOn)) {
              return item[filterOn];
            } else {
              return item;
            }
          };

          angular.forEach(items, function (item) {
            var valueToCheck, isDuplicate = false;

            for (var i = 0; i < newItems.length; i++) {
              if (angular.equals(extractValueToCompare(newItems[i]), extractValueToCompare(item))) {
                isDuplicate = true;
                break;
              }
            }
            if (!isDuplicate) {
              newItems.push(item);
            }
          });
          items = newItems;
        }
        return items;
    }

    function extractLot (index){
      if(!configuration.rows[index].code || !configuration.rows[index].validQuantity) {
        return
      }
      return $scope.model.avail_stocks.data.filter(function (item){
        return item.code == configuration.rows[index].code
      });
    }

    function selectLot (index){
      configuration.rows[index].lots = extractLot(index)
      for (var i = 0; i < configuration.rows[index].lots.length -1; i++) {
        for (var j = i+1; j < configuration.rows[index].lots.length; j++) {
          if (util.isDateAfter(configuration.rows[index].lots[i].expiration_date, configuration.rows[index].lots[j].expiration_date)) {
            tapon_lot = configuration.rows[index].lots[i];
            configuration.rows[index].lots[i] = configuration.rows[index].lots[j];
            configuration.rows[index].lots[j] = tapon_lot;
          }
        }
      }
      configuration.rows[index].lots = getLots(index)
    }

    function getLots (index) {
      var som = 0;
      configuration.rows[index].lots.forEach(function (item) {
        som+=(item.entered - item.moved - item.consumed);
        if (configuration.rows[index].quantity > som) {
            item.selected = true
        } else {
            if (som - (item.entered - item.moved - item.consumed)< configuration.rows[index].quantity) { item.selected = true }
        }
      })

      return configuration.rows[index].lots.filter(function (item){
        return item.selected
      })
    }

    function handleChange (index) {
      if(configuration.rows[index].quantity<=0 || !configuration.rows[index].quantity){
        configuration.rows[index].validQuantity = false
        configuration.rows[index].lots = [];
      }else{
        configuration.rows[index].validQuantity = true
        configuration.rows[index].lots = [];
        selectLot(index)
      }
    }

    $scope.preparDistribution = preparDistribution
    $scope.addRow = addRow
    $scope.removeRow = removeRow
    $scope.handleChange = handleChange
}]);
