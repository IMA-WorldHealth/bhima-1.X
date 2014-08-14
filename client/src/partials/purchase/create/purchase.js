angular.module('bhima.controllers')
.controller('purchaseOrder', [
  '$scope',
  '$q',
  '$translate',
  '$location',
  'validate',
  'connect',
  'appstate',
  'messenger',
  'uuid',
  'util',
  function($scope, $q, $translate, $location, validate, connect, appstate, messenger, uuid, util) {
    // TODO Module should only continue with selection of both employee and
    // supplier, currently just hides everything to look like this
    // TODO Currently downloads every location - should only download the
    // selected creditors location
    // FIXME Everything currently waits on validate to process (download) models
    // begin settup etc. before that
    var dependencies = {};
    var session = $scope.session = {}, warnings = $scope.warnings = {};

    dependencies.inventory = {
      query : {
        identifier : 'uuid',
        tables : {
          inventory : { columns : ['uuid', 'code', 'text', 'purchase_price', 'type_id'] }
        }
      }
    };

    dependencies.creditor = {
      query : {
        tables : {
          supplier : { columns : ['uuid', 'name', 'location_id', 'creditor_uuid'] },
        }
      }
    };

    dependencies.employee = {
      query : {
        tables : {
          employee : { columns : ['id', 'code', 'prenom', 'name', 'postnom', 'dob', 'creditor_uuid'] }
        }
      }
    };

    dependencies.creditorLocation = {
      identifier : 'uuid',
      query : '/location'
    };

    dependencies.user = {
      query : 'user_session'
    };

    dependencies.enterprise = {
      query : {
        tables : {
          enterprise : { columns : ['currency_id']}
        }
      }
    };

    warnings.invalid_price = {
      condition : function (item) { return item.code ? (Number(item.purchase_price) === 0) : false ; },
      message : 'PURCHASE.INVALID_PRICE',
    };

    appstate.register('project', function (project) {
      $scope.project = project;
       validate.process(dependencies).then(initialise);
    });

    function initialise(model) {
      angular.extend($scope, model);
      settupSession(session);
    }

    function settupSession(session) {
      session.selected = false;
      session.purchase = {
        uuid : uuid(),
        purchase_date : getDate(),
        note : formatPurchaseDescription()
      };
      session.hr_id = session.purchase.uuid.substr(0, 6);
      session.items = [];
    }

    function formatPurchaseDescription() {
      if (!session.creditor) { return '...'; }
      return [
        'PO',
        session.hr_id,
        session.date,
        session.creditor.name
      ].join('/');
    }

    function selectCreditor(creditor) {
      session.location = $scope.creditorLocation.get(creditor.location_id);
      session.purchase.note = formatPurchaseDescription();
      settupPurchase();
    }

    function settupPurchase() {
      session.items = [];
      addPurchaseItem();
    }

    function addPurchaseItem() {
      var item = new PurchaseItem();
      session.items.push(item);
      return item;
    }

    function PurchaseItem() {
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

    function updatePurchaseItem(purchaseItem, inventoryReference) {
      if (purchaseItem.inventoryReference) {
        $scope.inventory.post(purchaseItem.inventoryReference);
        $scope.inventory.recalculateIndex();
      }
      purchaseItem.set(inventoryReference);
      purchaseItem.inventoryReference = inventoryReference;

      // Remove option to select duplicates
      $scope.inventory.remove(inventoryReference.uuid);
      $scope.inventory.recalculateIndex();
    }

    function removePurchaseItem(index) {
      var currentItem = session.items[index];

      if (currentItem.inventoryReference) {
        $scope.inventory.post(currentItem.inventoryReference);
        $scope.inventory.recalculateIndex();
      }
      session.items.splice(index, 1);
    }

    function purchaseTotal() {
      return session.items.reduce(priceMultiplyQuantity, 0);
    }

    function priceMultiplyQuantity(a, b) {
      a = (a.quantity * a.purchase_price) || a;
      return (b.code) ? a + (b.quantity * b.purchase_price) : a;
    }


    function verifyPurchase(items) {
      var invalid = false;
      var invalidKeys = [];

      if (!items || !items.length) { return true; }

      invalid = items.some(function (purchaseItem) {

        Object.keys(warnings).forEach(function (key) {
          if (warnings[key].condition(purchaseItem)) {
            invalidKeys.push(key);
          }
        });

        if (!purchaseItem.code) {
          return true;
        }
        return false;
      });

      // FIXME
      Object.keys(warnings).forEach(function(key) {
        warnings[key].result = false;
        if (invalidKeys.indexOf(key) >= 0) {
          warnings[key].result = true;
        }
      });

      return invalid;
    }

    function submitPurchase() {
      var purchase = connect.clean(session.purchase);
      purchase.cost = purchaseTotal();
      purchase.purchase_date = util.sqlDate(purchase.purchase_date);
      purchase.currency_id = $scope.enterprise.data[0].currency_id;
      purchase.creditor_uuid = session.creditor.creditor_uuid;
      purchase.purchaser_id = $scope.user.data.id;
      purchase.project_id = $scope.project.id;
      purchase.employee_id = session.employee.id;

      writePurchaseLine(purchase)
      .then(writePurchaseItems(purchase.uuid))
      .then(writeSuccess)
      .catch(handleError);
    }

    function writePurchaseLine(purchase) {
      return connect.basicPut('purchase', [purchase], ['uuid']);
    }

    function writePurchaseItems(purchase_uuid) {
      var deferred = $q.defer();
      var writeRequest = [];

      writeRequest = session.items.map(function (item) {
        var writeItem = {
          uuid : uuid(),
          purchase_uuid : purchase_uuid,
          inventory_uuid : item.inventoryId,
          quantity : item.quantity,
          unit_price : item.purchase_price,
          total : item.quantity * item.purchase_price
        };
        return connect.basicPut('purchase_item', [writeItem], ['uuid']);
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

    function writeSuccess() {
       $location.path('/invoice/purchase/' + session.purchase.uuid);

      //  $translate('PURCHASE.WRITE_SUCCESS')
      // .then(function (value) {
      //   console.log('nous sommes la', value);
      //    messenger.success(value);
         
      // });
      //messenger.success($translate.instant('PURCHASE.WRITE_SUCCESS'));
     
    }

    function handleError(error) {
      $translate('PURCHASE.WRITE_FAILED')
      .then(function (value) {
         messenger.danger(value);
      });     
    }

    function getDate() {
      var now = new Date();
      return now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2) + '-' + ('0' + now.getDate()).slice(-2);
    } 

    $scope.selectCreditor = selectCreditor;
    $scope.addPurchaseItem = addPurchaseItem;
    $scope.removePurchaseItem = removePurchaseItem;
    $scope.updatePurchaseItem = updatePurchaseItem;
    $scope.purchaseTotal = purchaseTotal;
    $scope.verifyPurchase = verifyPurchase;
    $scope.submitPurchase = submitPurchase;
  }
]);
