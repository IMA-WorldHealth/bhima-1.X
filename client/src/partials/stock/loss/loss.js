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
  function ($scope, $routeParams, validate, appstate, uuid, $q, $http, $location) {
    /* jshint unused : false */
    var session = $scope.session = {},
      depotId, dependencies = {}, configuration = $scope.configuration = {};

    depotId  = $routeParams.depotId;
    session.block = !angular.isDefined(depotId);
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

    dependencies.avail_stocks = {
      identifier:'tracking_number',
      query : '/serv_dist_stock/' + depotId
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

    function complet (model) {
      console.log('on est la');
      return;
      // $scope.model = model;
      // return $q.all(model.avail_stocks.data.map(function (stock) {
      //   return connect.fetch('expiring_complete/'+stock.tracking_number+'/'+session.depot);
      // }));
    }

    function extendData (results) {
      // results.forEach(function (item, index) {
      //   if (!item[0].consumed) {
      //     $scope.model.avail_stocks.data[index].consumed = 0;
      //   }else{
      //     $scope.model.avail_stocks.data[index].consumed = item[0].consumed;
      //   }
      // });
      // $scope.model.avail_stocks.data = $scope.model.avail_stocks.data.filter(function (item){
      //   return (item.entered - item.consumed - item.moved) > 0;
      // });
      // $q.when();
    }


    function finalize () {
      // $scope.model.inventory = filtrer($scope.model.avail_stocks.data, 'inventory_uuid');
      // configuration.rows = [new DistributionRow()];
    }

    function DistributionRow (){
      this.code = null;
      this.lots = null;
      this.price = null;
      this.quantity = 0;
      this.validQuantity = false;
      this.price = 0;
      return this;
    }

    function addRow () {
      configuration.rows.push(new DistributionRow());
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
      //   console.log('ok', res);
      //   $location.path('/invoice/service_distribution/' + res.data.dist.docId);
      // });
    }

    function updateLigne (code, index){
      if(!code) { return 0; }
      configuration.rows[index].price = $scope.model.avail_stocks.data.filter(function (item){
        return item.code === code;
      })[0].purchase_price;
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
  }
]);
