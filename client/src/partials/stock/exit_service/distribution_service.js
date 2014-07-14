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
      this.validQuantity = false
      this.price = 0
      //this.current_cost = 0
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

    function handleChange (distribution_ligne, index) {
      if(distribution_ligne.quantity<=0 || !distribution_ligne.quantity){
        distribution_ligne.validQuantity = false
        distribution_ligne.lots = []
        configuration.rows[index].lots = []
      }else{
        distribution_ligne.validQuantity = true
        selectLot(distribution_ligne)
        configuration.rows[index] = distribution_ligne
        //distribution_ligne.current_cost = getInventoryPrice(distribution_ligne)
        //configuration.rows[index] = distribution_ligne
      }
    }

    function getInventoryPrice (distribution_ligne) {
      if(!distribution_ligne.code) return 0;
      return distribution_ligne.lots.filter(function (item){
        return item.code == distribution_ligne.code
      })[0].purchase_price * distribution_ligne.quantity
    }

    function selectLot (distribution_ligne){
      distribution_ligne.lots = extractLot(distribution_ligne)
      for (var i = 0; i < distribution_ligne.lots.length -1; i++) {
        for (var j = i+1; j < distribution_ligne.lots.length; j++) {
          if (util.isDateAfter(distribution_ligne.lots[i].expiration_date, distribution_ligne.lots[j].expiration_date)) {
            tapon_lot = distribution_ligne.lots[i];
            distribution_ligne.lots[i] = distribution_ligne.lots[j];
            distribution_ligne.lots[j] = tapon_lot;
          }
        }
      }
      distribution_ligne.lots = getLots(distribution_ligne)
    }

    function extractLot (distribution_ligne){
      if(!distribution_ligne.code || !distribution_ligne.validQuantity) {
        return
      }
      return $scope.model.avail_stocks.data.filter(function (item){
        return item.code == distribution_ligne.code
      });
    }

    function getLots (distribution_ligne) {
      var som = 0;
      distribution_ligne.lots.forEach(function (item) {
        som+=(item.entered - item.moved - item.consumed);
        if (distribution_ligne.quantity > som) {
            item.selected = true
        } else {
            if (som - (item.entered - item.moved - item.consumed)< distribution_ligne.quantity) { item.selected = true } else{item.selected = false}
        }
      })

      if(distribution_ligne.quantity > som){
        //overflow
        distribution_ligne.validQuantity = false
        return

      }

      console.log('notre somme est', som)


      return distribution_ligne.lots.filter(function (item){
        return item.selected
      })
    }

    // function duplicateProcessing (code, index ){
    //   var item = $scope.model.inventory.filter(function (item){
    //     return item.code = code
    //   })[0]

    //   if(item){
    //     $scope.model.inventory.splice(index, 1)
    //   }





    // }

    function updateLigne (code, index){
      if(!code) return 0;
      configuration.rows[index].price = $scope.model.avail_stocks.data.filter(function (item){
        return item.code == code
      })[0].purchase_price

      //duplicateProcessing(code, index)

     // $scope.model.inventory = $scope.model.inventory.filter(function (item){return item.code != code});
    }

    $scope.preparDistribution = preparDistribution
    $scope.addRow = addRow
    $scope.removeRow = removeRow
    $scope.handleChange = handleChange
    $scope.updateLigne = updateLigne

}]);
