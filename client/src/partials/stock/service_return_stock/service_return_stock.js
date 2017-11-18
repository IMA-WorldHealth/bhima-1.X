angular.module('bhima.controllers')
.controller('ServiceReturnStockController', ServiceReturnStockController);

ServiceReturnStockController.$inject = [
  '$routeParams', '$http', '$q', '$translate', '$location', 'SessionService',
  'messenger', 'connect', 'uuid', 'validate', 'util'
];

/**
  * Responsible for return medications from service to depot.
  * This is the following steps:
  *   1) Select the service in which there are stock to return
  *   2) Select medications
  *   3) Submission
  *   4) Print a receipt/generate documentation
  *   5) Increase the stock inventory account in the journal by debiting the
  *       stock account and crediting the cost of goods sold account.
  *       indicate the service as cost center in journal
  *
  * @constructor
  * @class ServiceReturnStockController
  */
function ServiceReturnStockController($routeParams, $http, $q, $translate, $location, SessionService, messenger, connect, uuid, validate, util) {
  var vm           = this,
      session      = vm.session = {},
      dependencies = {};

  // dependencies
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

  dependencies.services = {
    query : {
      identifier : 'id',
      tables : {
        'service' : { columns : ['id', 'name', 'cost_center_id'] }
      }
    }
  };

  dependencies.inventory = {
    query : {
      identifier : 'uuid',
      tables : {
        inventory : { columns : ['uuid', 'code', 'text', 'purchase_price', 'type_id', 'group_uuid'] },
        inventory_group : { columns : ['sales_account', 'stock_account'] },
      },
      join : ['inventory_group.uuid=inventory.group_uuid'],
      where : ['inventory_group.stock_account<>null']
    }
  };

  dependencies.employee = {
    query : {
      tables : {
        employee : { columns : ['id', 'code', 'prenom', 'name', 'postnom', 'creditor_uuid']}
      }
    }
  };

  dependencies.physicalStocks = {
    query : {
      identifier : 'tracking_number',
      tables : {        
        stock : { columns : ['tracking_number', 'lot_number', 'purchase_order_uuid']},
        purchase : {columns : ['uuid']},
        purchase_item : {columns : ['unit_price']}
      },
      join : ['stock.purchase_order_uuid=purchase.uuid', 'purchase.uuid=purchase_item.purchase_uuid']
    }
  };

  // initialize models
  vm.session.step  = null;
  vm.session.total = 0;
  vm.session.stocks = [];
  vm.session.integrationStarted = false;

  // Expose models to the views
  vm.startingReturnProcess = startingReturnProcess;
  vm.addStockItem = addStockItem;
  vm.removeStockItem = removeStockItem;
  vm.updateStockItem = updateStockItem;
  vm.isValidLine = isValidLine;
  vm.preview = preview;
  vm.isPassed = isPassed;
  vm.goback = goback;
  vm.reset = reset;
  vm.integrate = integrate;

  // start the module up
  startup();

  // Functions definitions
  function startup() {
    if (angular.isUndefined($routeParams.depotId)) {
      messenger.error($translate.instant('UTIL.NO_DEPOT_SELECTED'), true);
      return;
    }
    validate.process(dependencies)
    .then(initialize)
    .catch(error);
  }

  function initialize(models) {
    angular.extend(vm, models);
    vm.session.depot = vm.depots.get($routeParams.depotId);
  }

  function error (err) {
    console.error(err);
    return;
  }

  function startingReturnProcess () {
    if (!vm.service || !vm.service.id) { return; }
    vm.session.step = 'select_inventories';
    vm.session.integrationStarted = true;
    addStockItem();
  }

  function addStockItem () {
    var stock = new StockItem();
    vm.session.stocks.push(stock);
  }

  function StockItem () {
    var self = this;

    this.code = undefined;
    this.inventory_uuid = null;
    this.text = null;
    this.date = new Date();
    this.lot_number = undefined;
    this.tracking_number = null;
    this.quantity = 0;
    this.purchase_price = 0;
    this.purchase_order_uuid = null;
    this.isValidStock = false;


    this.set = function (inventoryReference) {
      self.inventory_uuid = inventoryReference.uuid;
      self.code = inventoryReference.code;
      self.text = inventoryReference.text;
      self.date = new Date();
      self.isSet = true;
    };

    return this;
  }

  function removeStockItem (idx) {
    vm.session.stocks.splice(idx, 1);
    updateTotal();
  }

  function updateStockItem (stockItem, inventoryReference) {
    stockItem.set(inventoryReference);
  }

  function isValidLine (stockItem) {
    if(angular.isDefined(stockItem.code) &&
       angular.isDefined(stockItem.lot_number) &&
       stockItem.quantity > 0
      ){
      stockItem.isValidStock = true;
      updateTotal();
    }else{
      stockItem.isValidStock = false;
    }
  }

  function isPassed (){
    return vm.session.stocks.every(function (item){
      return item.isValidStock === true;
    });
  }

  function preview () {
    vm.session.step = 'preview_inventories';
  }

  function updateTotal (){
    vm.session.total = vm.session.stocks.reduce(function (a, b){ return a + b.quantity * b.purchase_price; }, 0);
  }

  function goback () {
    vm.session.step = 'select_inventories';
  }

  function reset () {
    vm.session.stocks = [];
    vm.session.step = null;
  }

  // function simulatePurchase() {
  //   return {
  //     uuid          : uuid(),
  //     cost          : vm.session.total,
  //     purchase_date : util.sqlDate(new Date()),
  //     currency_id   : SessionService.enterprise.currency_id,
  //     creditor_uuid : null,
  //     purchaser_id  : null,
  //     emitter_id    : SessionService.user.id,
  //     project_id    : SessionService.project.id,
  //     receiver_id   : null,
  //     note          : 'Service Return Stock/' + vm.service.name + '/' + vm.description + '/' + util.sqlDate(new Date()),
  //     paid          : 0,
  //     confirmed     : 0,
  //     closed        : 0,
  //     is_integration: 0,
  //     is_direct     : 0,
  //     is_return     : 1
  //   };
  // }

  function getStockItemByLotNumber (lotNumber) {
    var line = vm.physicalStocks.data.filter(function (item) {
      return item.lot_number === lotNumber;
    })[0];

    return line;
  }

  function getStockItemByTrackingNumber (tn) {
    var line = vm.physicalStocks.data.filter(function (item) {
      return item.tracking_number === tn;
    })[0];

    return line;
  }

  function getStocks() {
    var stocks = [];

    vm.session.stocks.forEach(function (item) {
      var stockItem = getStockItemByLotNumber(item.lot_number);

      if(stockItem) {
        var stock = {
          tracking_number      : stockItem.tracking_number,
          lot_number           : item.lot_number,
          inventory_uuid       : item.inventory_uuid,
          entry_date           : util.sqlDate(new Date()),
          quantity             : item.quantity,
          expiration_date      : util.sqlDate(StockItem.expiration_date),
          purchase_order_uuid  : stockItem.purchase_order_uuid
        };

        stocks.push(stock);
      }      
    });

    //if some lot number are not valid the two arrays will not be equal, so empty the stocks
    if(stocks.length !== vm.session.stocks.length) {
      stocks = [];
    }

    return stocks;
  }

  function getConsumptionRummage (document_id) {
    var consumptions = [], rummages = [];
    vm.stocks.forEach(function (item) {
      var line = getStockItemByTrackingNumber(item.tracking_number);

      var consumption = {
        uuid            : uuid(),
        depot_uuid      : vm.session.depot.uuid,
        date            : util.sqlDate(new Date()),
        document_id     : document_id,        
        tracking_number : item.tracking_number,
        quantity        : item.quantity * -1,
        unit_price      : line.unit_price
      };

      var rummage = {
        uuid              : uuid(),
        consumption_uuid  : consumption.uuid,
        document_uuid     : document_id
      }

      consumptions.push(consumption);
      rummages.push(rummage);
    });

    return {consumptions : consumptions, rummages : rummages};
  }

  function integrate () {
    // console.log('appelle de la methode integrate');

    // var purchase = simulatePurchase();
    // var purchase_items = getPurchaseItem(purchase.uuid);

    var document_id = uuid();    
    vm.stocks = getStocks();

    if(vm.stocks.length === 0) {
      messenger.error($translate.instant('STOCK.ENTRY.WRITE_ERROR'), false);
      console.error('Tableau vm.stock donne une longeur 0, verifier que le lot introduit existe ou voir service_return_stock.js');
      return;
    }

    var consumptionRummage = getConsumptionRummage(document_id);

    // connect.post('purchase', purchase)
    // .then(function (){
    //   var promisses = purchase_items.map(function (item){
    //     return connect.post('purchase_item', item);
    //   });
    //   return $q.all(promisses);
    // })

    // .then(function (){
    //   var promisses = stocks.map(function (item){
    //     return connect.post('stock', item);
    //   });
    //   return $q.all(promisses);
    // })

    // var promisses = vm.stocks.map(function (item){
    //   return connect.post('stock', item);
    // });

    // $q.all(promisses)
    // .then(function (){
      var promisses = consumptionRummage.consumptions.map(function (item){
        return connect.post('consumption', item);
      });
      return $q.all(promisses)
      .then(function (){
        var promisses = consumptionRummage.rummages.map(function (item){
          return connect.post('consumption_rummage', item);
        });
        return $q.all(promisses);
      })
    // })
    .then(function () {
      // journal notify return stock from service
      var params = {
        // purchase_uuid   : purchase.uuid,
        stock_ids       : vm.stocks.map(function (item){ return {inventory_uuid : item.inventory_uuid, purchase_uuid : item.purchase_order_uuid, quantity : item.quantity};}),
        cost_center_id  : vm.service.cost_center_id,
        project_id : SessionService.project.id
      };

      return $http.get('/journal/service_return_stock/' + JSON.stringify(params));
    })
    .then(function (){
      messenger.success($translate.instant('STOCK.ENTRY.WRITE_SUCCESS'), false);
      return $q.when(1);
    })
    .then(function () {
      $location.path('/stock/rummage/report/' + document_id);
    })
    .catch(function (err) {
      // notify error
      messenger.error($translate.instant('STOCK.ENTRY.WRITE_ERROR'), false);
      console.error(err);

      // rollback
      var stock_ids = vm.stocks.map(function (stock){return stock.tracking_number;});
      connect.delete('movement', 'tracking_number', stock_ids)
      .catch(function (err){console.log('can not remove corrumpted data, inform the admin of system');});
    });
  }

}
