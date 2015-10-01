angular.module('bhima.controllers')
.controller('DonationManagementController', DonationManagementController);

DonationManagementController.$inject = [
  '$scope', '$q', '$translate', '$location', '$routeParams', 'validate', 'connect', 'appstate',
  'messenger', 'precision', 'store', 'uuid', 'util', 'appcache', '$http', 'SessionService'
];

function DonationManagementController($scope, $q, $translate, $location, $routeParams, validate, connect, appstate, messenger, precision, Store, uuid, util, Appcache, $http, Session) {
  var vm = this,
      dependencies = {},
      session = $scope.session = {cfg : {}, totals : [], selectedAccount : {}, configured : true},
      warnings = $scope.warnings = {};

  if (!angular.isDefined($routeParams.depotId)) {
    return messenger.error('NO_DEPOT_ID');
  }

  var cache = new Appcache('donation');

  $scope.project = Session.project;
  $scope.user = Session.user;
  $scope.enterprise = Session.enterprise;

  session.crud_or_read = 'crud';
  session.view = $translate.instant('DONATION_MANAGEMENT.SEE_ALL');
  session.cfg.depot = { id : $routeParams.depotId };

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

  dependencies.inventory = {
    query : {
      identifier : 'uuid',
      tables : {
        inventory : { columns : ['uuid', 'code', 'text', 'purchase_price', 'type_id', 'group_uuid'] },
        inventory_group : { columns : ['sales_account', 'stock_account', 'donation_account'] },
      },
      join : ['inventory_group.uuid=inventory.group_uuid'],
      where : ['inventory_group.donation_account<>null','AND','inventory_group.stock_account<>null']
    }
  };

  dependencies.donor = {
    query : {
      tables : {
        donor : { columns : ['id', 'name']}
      }
    }
  };

  dependencies.employee = {
    query : {
      tables : {
        employee : { columns : ['id', 'code', 'prenom', 'name', 'postnom', 'dob', 'creditor_uuid']}
      }
    }
  };

  dependencies.donations = {
    query : {
      tables : {
        donations     : { columns : ['date']},
        donation_item : { columns : ['uuid']},
        inventory     : { columns : ['text']},
        stock         : { columns : ['tracking_number','lot_number','quantity']},
        donor         : { columns : ['name']}
      },
      join : [
        'donations.donor_id=donor.id',
        'donations.uuid=donation_item.donation_uuid',
        'inventory.uuid=stock.inventory_uuid',
        'stock.tracking_number=donation_item.tracking_number'
      ]
    }
  };

  dependencies.accounts = {
    required : true,
    query : 'getAccount7/'
  };

  function initialise() {
    validate.process(dependencies)
    .then(startup)
    .catch(error);
  }

  function startup (models) {

    session.config = {};
    session.config.date = new Date();
    session.donation = {};
    session.donation.items = [];
    addDonationItem();

    angular.extend($scope, models);
    session.depot = $scope.depots.get($routeParams.depotId);
    // return cache.fetch('selectedAccount');
  }

  function error (err) {
    messenger.danger(JSON.stringify(err));
  }

  function DonationItem() {
    var self = this;

    function set(inventoryReference) {
      self.quantity = self.quantity || 1;
      self.code = inventoryReference.code;
      self.text = inventoryReference.text;

      // FIXME naive rounding - ensure all entries/ exits to data are rounded to 4 DP
      self.purchase_price = Number(inventoryReference.purchase_price.toFixed(4));
      self.inventoryId = inventoryReference.uuid;
      self.note = '';
      self.isSet = true;
    }

    this.quantity = 0;
    this.code = null;
    this.inventoryId = null;
    this.purchase_price = null;
    this.text = null;
    this.note = null;
    this.set = set;

    return this;
  }

  function addDonationItem () {
    var item = new DonationItem();
    session.donation.items.push(item);
    return item;
  }

  $scope.updateDonationItem = function (donationItem, inventoryReference) {
    if (donationItem.inventoryReference) {
      $scope.inventory.post(donationItem.inventoryReference);
      $scope.inventory.recalculateIndex();
    }
    donationItem.set(inventoryReference);
    donationItem.inventoryReference = inventoryReference;

    // Remove option to select duplicates
    $scope.inventory.remove(inventoryReference.uuid);
    $scope.inventory.recalculateIndex();
  };

  function removeDonationItem (index) {
    var currentItem = session.donation.items[index];

    if (currentItem.inventoryReference) {
      $scope.inventory.post(currentItem.inventoryReference);
      $scope.inventory.recalculateIndex();
    }
    session.donation.items.splice(index, 1);
  }

  $scope.donationTotal = function () {
    return session.donation.items.reduce(priceMultiplyQuantity, 0);
  };

  function nextStep() {
    if (session.donation.items.length > 0) {

      session.donation.items.forEach(function (donation) {
        donation.lots = new Store({ identifier : 'tracking_number', data : [] });
        angular.extend(donation, { isCollapsed : false });
        $scope.addLot(donation);
      });

      calculateTotals();
      // set up watchers for totalling and validation
      var listenCalculateTotals = $scope.$watch('session.donation.items', calculateTotals, true);
      var listenValidateSession = $scope.$watch('session.donation.items', validateSession, true);

      session.donation.step = 'input_inventories';
    }
  }

  $scope.previousStep = function previousStep() {
    session.donation.step = 'select_inventories';
  };

  function priceMultiplyQuantity(a, b) {
    a = (a.quantity * a.purchase_price) || a;
    return (b.code) ? a + (b.quantity * b.purchase_price) : a;
  }

  function validateSession () {
    session.valid = session.donation.items.every(function (drug) {
      return drug.validLots;
    });
  }

  function Lot () {
    this.inventory_uuid = null;
    this.expiration_date = new Date();
    this.date = new Date();
    this.lot_number = null;
    this.tracking_number = uuid();
    this.quantity = 0;
    this.purchase_order_uuid = null;
  }

  function addLot (drug) {
    var lot = new Lot();
    lot.code = drug.code;
    lot.inventory_uuid = drug.inventory_uuid;
    drug.lots.post(lot);
  }

  $scope.removeLot = function removeLot (drug, idx) {
    drug.lots.data.splice(idx, 1);
  };

  $scope.expand = function expand (drug) {
    drug.isCollapsed = !drug.isCollapsed;
  };

  function sum (a, b) {
    return a + Number(b.quantity);
  }

  function calculateTotals () {
    if (!session.donation || !session.donation.items) { return; }

    // total and calculate metadata
    var totals = session.totals;

    totals.quantity = 0;
    totals.price = 0;
    totals.purchase_price = 0;
    totals.items = session.donation.items.length;

    session.donation.items.forEach(function (donation) {

      totals.quantity += Math.round(donation.quantity);
      totals.price += Math.round(donation.purchase_price * donation.quantity);

      donation.totalQuantity = donation.lots.data.reduce(sum, 0);
      donation.validLots = valid(donation.lots) && donation.totalQuantity === donation.quantity;
    });
  }

  function valid (lots) {
    var isDef = angular.isDefined;
    return lots.data.every(function (row) {
      var newDate = new Date().getTime(),
        expirate = new Date(row.expiration_date).getTime(),
        diffDays = (parseInt((expirate-newDate)/(24*3600*1000)));

      var n = parseFloat(row.quantity);
      return n > 0 && (diffDays > 0) && isDef(row.lot_number) &&
        isDef(row.expiration_date) &&
        !!row.lot_number;
    });
  }

  $scope.cancel = function cancel () {
    session = $scope.session = { cfg : {}, totals : [] };
  };

  $scope.review = function review () {
    // prepare object for cloning
    session.review = true;
    var lots = [];
    session.donation.items.forEach(function (o) {
      o.lots.data.forEach(function (item) {
        item.inventory_uuid = o.inventoryId;
      });
      lots = lots.concat(o.lots.data);
    });
    session.lots = lots;
  };

  $scope.accept = function () {
    var document_id = uuid();
    var lots = processLots();
    var don = processDonations();

    var donation = don.donation;
    var donation_items = don.donation_items;
    var movement = processMovements(document_id);
    var synthese = [];

    session.donation.items.forEach(function (inventoryReference) {
      var inventory_lots = [],
          sum_lots = 0;

      inventoryReference.lots.data.forEach(function (lot) {
        sum_lots += lot.quantity;
        inventory_lots.push(lot.tracking_number);
      });

      synthese.push({
        movement         : {
          document_id    : document_id
        },
        inventory_uuid   : inventoryReference.inventoryId,
        donation         : donation,
        tracking_numbers : inventory_lots,
        quantity         : sum_lots,
        purchase_price   : inventoryReference.purchase_price,
        currency_id      : $scope.enterprise.currency_id,
        project_id       : $scope.project.id
      });

    });

    connect.post('stock',lots)
      .then(function () {
        return connect.post('movement', movement);
      })
      .then(function () {
        return connect.post('donations', [donation]);
      })
      .then(function () {
        return connect.post('donation_item', donation_items);
      })
      .then(simulatePurchase)
      .then(function () {
        $location.path('/stock/donation_management/report/' + document_id);
      })
      .then(function () {
        messenger.success($translate.instant('STOCK.ENTRY.WRITE_SUCCESS'));
      })
      .catch(function () {
        messenger.error('STOCK.ENTRY.WRITE_ERROR');
      });

  };

  function processMovements (document_id) {
    var movements = [];
    session.lots.forEach(function (lot) {
      movements.push({
        uuid : uuid(),
        document_id     : document_id,
        tracking_number : lot.tracking_number,
        date            : util.sqlDate(new Date()),
        quantity        : lot.quantity,
        depot_entry     : session.cfg.depot.id
      });
    });

    return movements;
  }

  function processLots () {
    // Lot a inserer dans la table `stock`
    var lots = [];
    session.lots.forEach(function (lot) {
      lots.push({
        inventory_uuid      : lot.inventory_uuid,
        expiration_date     : util.sqlDate(lot.expiration_date),
        entry_date          : util.sqlDate(new Date()),
        lot_number          : lot.lot_number,
        tracking_number     : lot.tracking_number,
        quantity            : lot.quantity,
        purchase_order_uuid : lot.purchase_order_uuid
      });
    });

    return lots;
  }

  function processDonations () {
    var don = { donation : {}, donation_items : [] };

    don.donation = {
        uuid            : uuid(),
        donor_id        : session.config.donor.id,
        employee_id     : session.config.employee.id,
        date            : util.sqlDate(session.config.date),
        is_received     : 1
    };

    session.lots.forEach(function (lot) {
      don.donation_items.push({
        uuid : uuid(),
        donation_uuid : don.donation.uuid,
        tracking_number : lot.tracking_number
      });
    });

    return don;
  }

  $scope.toggleView = function () {
    if (session.crud_or_read === 'crud') {
      session.crud_or_read = 'read';
      session.view = $translate.instant('DONATION_MANAGEMENT.NEW');
      session.crud = true;
    } else if (session.crud_or_read === 'read') {
      session.crud_or_read = 'crud';
      session.view = $translate.instant('DONATION_MANAGEMENT.SEE_ALL');
      session.read = true;
    }
  };

  function formatAccount (acc) {
    return [acc.account_number, acc.account_txt].join(' - ');
  }

  function setConfiguration (acc) {
    if (acc) {
      cache.put('selectedAccount', acc);
      session.configured = true;
      session.acc = acc;
    }
  }

  function reconfigure() {
    cache.remove('selectedAccount');
    session.acc = null;
    session.configured = false;
  }

  function simulatePurchase() {
    if (session.donation.items.length > 0) {

      var purchase = {
        uuid          : uuid(),
        cost          : simulatePurchaseTotal(),
        purchase_date : util.sqlDate(session.config.date),
        currency_id   : $scope.enterprise.currency_id,
        creditor_uuid : null,
        purchaser_id  : session.config.employee.id, //$scope.user.data.id,
        project_id    : $scope.project.id,
        note          : 'DONATION ' + session.config.donor.name + '/' + util.sqlDate(session.config.date),
        receiver_id   : session.config.employee.id,
        paid          : 0,
        confirmed     : 0,
        closed        : 0,
        is_donation   : 1,
        is_direct     : 0
      };

      simulateWritePurchaseLine(purchase)
      .then(simulateWritePurchaseItems(purchase.uuid))
      .then(updateStockPurchaseOrder(purchase.uuid))
      .catch(handleError);
    }

  }

  function updateStockPurchaseOrder (purchase_uuid) {
    session.lots.forEach(function (lot) {
      var stockEntry = {
        tracking_number     : lot.tracking_number,
        purchase_order_uuid : purchase_uuid
      };
      connect.put('stock',[stockEntry], ['tracking_number']);
    });
  }

  function simulatePurchaseTotal() {
    return session.donation.items.reduce(priceMultiplyQuantity, 0);
  }


  function simulateWritePurchaseLine(purchase) {
    return connect.post('purchase', [purchase], ['uuid']);
  }

  function simulateWritePurchaseItems(purchase_uuid) {
    var deferred = $q.defer();
    var writeRequest = [];

    writeRequest = session.donation.items.map(function (item) {
      var writeItem = {
        uuid           : uuid(),
        purchase_uuid  : purchase_uuid,
        inventory_uuid : item.inventoryId,
        quantity       : item.quantity,
        unit_price     : item.purchase_price,
        total          : item.quantity * item.purchase_price
      };
      return connect.post('purchase_item', [writeItem], ['uuid']);
    });

    $q.all(writeRequest)
    .then(function (result) {
      deferred.resolve(result);
    })
    .catch(function (error) {
      deferred.reject(error);
    });
    return deferred.promise;
  }

  function handleError(error) {
    $translate('PURCHASE.WRITE_FAILED')
    .then(function (value) {
       messenger.danger(value);
    });
  }

  // start the module up
  initialise();

  $scope.formatAccount = formatAccount;
  $scope.setConfiguration = setConfiguration;
  $scope.addDonationItem = addDonationItem;
  $scope.removeDonationItem = removeDonationItem;
  $scope.reconfigure = reconfigure;
  $scope.nextStep = nextStep;
  $scope.addLot = addLot;
}
