angular.module('bhima.controllers')
.controller('stock.distribution', [
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
      // FIXME
      index : -1,
      state : null,
      depot : $routeParams.depotId,
      lotSelectionSuccess : false,
      lotSelectionFailure : false
    };
    var dependencies = {};

    // Test for module organised into step structure
    var moduleDefinition = $scope.moduleDefinition = [
      {
        title : 'Locate Patient',
        template : 'patientSearch.tmpl.html',
        method : null
      },
      {
        title : 'Select prescription sale',
        template : 'selectSale.tmpl.html',
        method : null
      },
      {
        title : 'Allocate medicine',
        template : 'allocateLot.tmpl.html',
        method : null
      }
    ];

    var stock = {
      NONE : {
        //TODO Replace with translatable key
        alert : 'This item is not in stock in the depot, contact the stock administrator',
        icon : 'glyphicon-remove-sign error'
      },
      LIMITED_STOCK : {
        alert : 'There is not enough valid stock available to fulfill the order, contact the stock administrator.',
        icon : 'glyphicon-info-sign warn'
      },
      EXPIRED : {
        alert : 'Available stock CANNOT be used as it has expired, contact the stock administrator.',
        icon : 'glyphicon-info-sign error'
      }
    };

    dependencies.ledger = {};

    moduleStep();

    function initialiseDistributionDetails(patient) {
      console.log(patient);
      dependencies.ledger.query = '/ledgers/debitor/' + patient.debitor_uuid;
      session.patient = patient;
      validate.process(dependencies).then(startup);
    }

    function startup(model) {
      angular.extend($scope, model);

      moduleStep();
      console.log(model);
    }

    function moduleStep() {
      // FIXME
      session.index += 1;
      session.state = moduleDefinition[session.index];
      // session.state.method();
    }

    function selectSale(sale) {
      session.sale = sale;

      moduleStep();

      getSaleDetails(sale).then(function (saleDetails) {
        var detailsRequest = [];
        session.sale.details = saleDetails.data;

        detailsRequest = session.sale.details.map(function (saleItem) {
          return connect.req('inventory/depot/' + session.depot + '/drug/' + saleItem.code);
        });

        $q.all(detailsRequest).then(function (result) {
          console.log('got all lot details');
          session.sale.details.forEach(function (saleItem, index) {
            var itemModel = result[index];

            console.log('assigning', result);
            if (itemModel.data.length) { saleItem.lots = itemModel; }
          });


          recomendLots(session.sale.details);

          session.lotSelectionSuccess = verifyValidLots(session.sale.details);
        })
        .catch(function (error) {
          messenger.error(error);
        });
      });
    }

    function recomendLots(saleDetails) {
      // Corner cases
      // - ! Lot exists but does not have enough quantity to provide medicine
      // - No lots exist, warning status
      // - ! Lot exists but is expired, stock administrator
      // - Lot exists with both quantity and expiration date

      saleDetails.forEach(function (saleItem) {
        var validUnits = 0;
        var sessionLots = [];

        console.log('Determining lots for ', saleItem);

        // Ignore non consumable items
        if (!saleItem.consumable) { return; }

        // Check to see if any lots exist (expired stock should be run through the stock loss process)
        if (!saleItem.lots) {
          saleItem.stockStatus = stock.NONE;
          return;
        }

        console.log('Found lots for sale item');

        // If lots exist, order them by experiation and quantity
        saleItem.lots.data.sort(orderLotsByUsability);
        saleItem.lots.recalculateIndex();

        // Iterate through ordered lots and determine if there are enough valid units
        saleItem.lots.data.forEach(function (lot) {
          var expired = new Date(lot.expiration_date) < new Date();

          if (!expired) {

            var unitsRequired = saleItem.quantity - validUnits;

            if (unitsRequired > 0) {
              // Add lot to recomended lots
              var lotQuantity = (lot.quantity > unitsRequired) ? unitsRequired : lot.quantity;
              sessionLots.push({details : lot, quantity : lotQuantity});
              validUnits += lotQuantity;

            }
          } else {
            messenger.danger('Lot ' + lot.lot_number + ' has expired and cannot be used, contact the stock administrator.', true);
          }
        });

        if (validUnits < saleItem.quantity) {
          saleItem.stockStatus = stock.LIMITED_STOCK;
        }

        if (sessionLots.length) { saleItem.recomendedLots = sessionLots; }
      });
    }

    function orderLotsByUsability(a, b) {
      // Order first by expiration date, then by quantity

      var aDate = new Date(a.expirationDate),
          bDate = new Date(b.expirationDate);

      if (aDate === bDate) {
        return (a.quantity < b.quantity) ? -1 : (a.quantity > b.quantity) ? 1 : 0;
      }

      return (aDate < bDate) ? -1 : 1;
    }

    function verifyValidLots(saleDetails) {
      var invalidLots = false;

      console.log('checking valid lots');

      //Ensure each item has a lot
      invalidLots = saleDetails.some(function (item) {
        console.log('validating lot', item);

        // ignore non consumables (FIXME better way tod do this across everything)
        if (!item.consumable) { return false; }

        // FIXME hack - if a status has been reported, cannot be submitted
        if (item.stockStatus) { return true; }

        // console.log('item has lots assigned');
      });

      console.log('looped through lots, found invalid', invalidLots);

      // Update on failed attempt - EVERY validation
      session.lotSelectionFailure = invalidLots;
      return !invalidLots;
    }

    function getSaleDetails(sale) {
      console.log('sale', sale);
      var query = {
        tables : {
          sale_item : {
            columns : ['sale_uuid', 'uuid', 'inventory_uuid', 'quantity']
          },
          inventory : {
            columns : ['code', 'text', 'consumable']
          }
        },
        where : ['sale_item.sale_uuid=' + sale.inv_po_id],
        join : ['sale_item.inventory_uuid=inventory.uuid']
      };

      return connect.req(query);
    }

    function submitConsumption() {
      var submitItem = [];

      // Ensure validation is okay
      if (!session.lotSelectionSuccess) { return messenger.danger('Cannot verify lot allocation'); }

      // Iterate through items, write consumption line for each lot
      session.sale.details.forEach(function (consumptionItem) {

        if (!angular.isDefined(consumptionItem.recomendedLots)) { return; }

        consumptionItem.recomendedLots.forEach(function (lot) {
          submitItem.push({
            uuid : uuid(),
            depot_uuid : session.depot,
            date : util.convertToMysqlDate(new Date()),
            document_id : consumptionItem.sale_uuid,
            tracking_number : lot.details.tracking_number,
            quantity : lot.quantity
          });
        });
      });

      console.log('items', submitItem);
      connect.basicPut('consumption', submitItem)
      .then(function () {
        // messenger.success('Consumption successfully written', true);
        console.log('sale', session.sale);
        $location.path('/invoice/consumption/' + session.sale.inv_po_id);
      })
      .catch(function (error) {
        console.log(error);
        messenger.error(error);
      });
    }

    $scope.selectSale = selectSale;
    $scope.initialiseDistributionDetails = initialiseDistributionDetails;
    $scope.submitConsumption = submitConsumption;
  }
]);
