angular.module('bhima.controllers')
.controller('stock.loss', [
  '$scope',
  '$routeParams',
  'validate',
  'appstate',
  'uuid',
  '$q',
  '$http',
  '$location',
  'connect',
  'util',
  function ($scope, $routeParams, validate, appstate, uuid, $q, $http, $location, connect, util) {
    /* jshint unused : false */
    var session = $scope.session = {},
      depotId, dependencies = {}, configuration = $scope.configuration = {};

    depotId  = $routeParams.depotId;
    session.block = !angular.isDefined(depotId);
    session.document_id = uuid();
    session.depotId = depotId;
    session.date = new Date();
    dependencies.depots = {
      query : {
        tables : {
          'depot' : {
            columns : ['uuid', 'reference', 'text', 'enterprise_id']
          }
        },
        where : ['depot.uuid='+depotId]
      }
    };

    dependencies.project = {
      query : {
        tables : {
          'project' : {
            columns : ['id', 'name']
          },
          'enterprise' : {
            columns : ['currency_id']
          }
        },
        join : ['project.enterprise_id=enterprise.id']
      }
    };

    dependencies.avail_stocks = {
      identifier:'tracking_number',
      query : '/serv_dist_stock/' + depotId
    };


    function complet (model) {
      $scope.model = model;
      return $q.all(model.avail_stocks.data.map(function (stock) {
        return connect.fetch('expiring_complete/'+stock.tracking_number+'/'+depotId);
      }));
    }

    function extendData (results) {
      results.forEach(function (item, index) {
        if (!item[0].consumed) {
          $scope.model.avail_stocks.data[index].consumed = 0;
        }else{
          $scope.model.avail_stocks.data[index].consumed = item[0].consumed;
        }
      });
      $scope.model.avail_stocks.data = $scope.model.avail_stocks.data.filter(function (item){
        return (item.entered - item.consumed - item.moved) > 0;
      });
      $q.when();
    }

    function finalize () {
      $scope.model.inventory = filtrer($scope.model.avail_stocks.data, 'inventory_uuid');
      configuration.rows = [new LossRow()];
    }

    function LossRow (){
      this.code = null;
      this.lot = null;
      this.lots = null;
      this.price = null;
      this.quantity = 0;
      this.validQuantity = false;
      this.price = 0;
      return this;
    }

    function addRow () {
      configuration.rows.push(new LossRow());
    }

    function removeRow (index) {
      configuration.rows.splice(index, 1);
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

    function verifyLost () {
      if (!configuration.rows || configuration.rows.length < 1) {return true;}
      return !configuration.rows.every(function (row){
        return row.code && row.validQuantity;
      });
    }

    function submit (){
      // var consumption = buildConsumptions();
      // consumption.details = $scope.model.project.data[0];
      // $http.post('service_dist/', consumption)
      // .then(function (res){
      //   $location.path('/invoice/loss/' + res.data.dist.docId);
      // });
    }

    function updateLigne (code, index){
      if(!code) { return 0; }
      configuration.rows[index].price = $scope.model.avail_stocks.data.filter(function (item){
        return item.code === code;
      })[0].purchase_price;
      configuration.rows[index].lots = extractLot(code);
    }

    function extractLot (code){
      if(!code) {
        return;
      }
      return $scope.model.avail_stocks.data.filter(function (item){
        console.log('item', item);
        return item.code === code;
      });
    }

    function calculateTotal () {
      var total = 0;
      if (!configuration.rows) {
        total = 0;
        return total;
      }
      configuration.rows.forEach(function (item) {
        total = total + (item.price * item.quantity);
      });
      return total;
    }

    function handleQuantity (loss_ligne, index) {

      if(loss_ligne.quantity<=0 || !loss_ligne.quantity || !testQuantity(loss_ligne.tracking_number, index)){
        loss_ligne.validQuantity = false;
      }else{
        loss_ligne.validQuantity = true;
        configuration.rows[index] = loss_ligne;
      }

    }

    function testQuantity (track, index) {
      return (configuration.rows[index].lot.entered - (configuration.rows[index].lot.moved + configuration.rows[index].lot.consumed)) >= configuration.rows[index].quantity;
    }

    function selectLot (loss_ligne){
      loss_ligne.lots = extractLot(loss_ligne);
      for (var i = 0; i < loss_ligne.lots.length -1; i++) {
        for (var j = i+1; j < loss_ligne.lots.length; j++) {
          if (util.isDateAfter(loss_ligne.lots[i].expiration_date, loss_ligne.lots[j].expiration_date)) {
            var tapon_lot = loss_ligne.lots[i];
            loss_ligne.lots[i] = loss_ligne.lots[j];
            loss_ligne.lots[j] = tapon_lot;
          }
        }
      }
      return;
      //loss_ligne.lots = getLots(loss_ligne);
    }

    function verifyLoss () {
      if (!configuration.rows || configuration.rows.length < 1) {return true;}
      return !configuration.rows.every(function (row){
        return row.code && row.validQuantity;
      });
    }

    appstate.register('project', function (project){
      dependencies.project.query.where = ['project.id='+project.id];
      validate.process(dependencies)
      .then(complet)
      .then(extendData)
      .then(finalize);
    });

    $scope.addRow = addRow;
    $scope.removeRow = removeRow;
    $scope.updateLigne = updateLigne;
    $scope.verifyLost = verifyLost;
    $scope.submit = submit;
    $scope.calculateTotal = calculateTotal;
    $scope.handleQuantity = handleQuantity;
    $scope.verifyLoss = verifyLoss;
  }
]);
