angular.module('kpk.controllers')
.controller('purchaseOrder', [
  '$scope',
  '$q',
  '$translate',
  'validate',
  'connect',
  'appstate',
  'messenger',
  'uuid',
  function($scope, $q, $translate, validate, connect, appstate, messenger, uuid) {
    // TODO invoice_date -> purchase_date
    
    // TODO Currently downloads every location - should only download the 
    // selected creditors location
    
    // FIXME Everything currently waits on validate to process (download) models
    // begin settup etc. before that
    var dependencies = {}, session = $scope.session = {};
    
    dependencies.inventory = { 
      query : { 
        identifier : 'uuid',
        tables : { 
          inventory : { columns : ['uuid', 'code', 'text', 'price', 'type_id'] }
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

    validate.process(dependencies).then(initialise);
    
    function initialise(model) { 
      
      // Expose models to the scope
      angular.extend($scope, model);
      settupSession(session); 
    }

    function settupSession(session) { 
      session.selected = false;
      session.purchase = { 
        uuid : uuid(),
        // payable : false,
        invoice_date : getDate(), 
        note : formatPurchaseDescription()
      };
      session.hr_id = session.purchase.uuid.substr(0, 6);

      session.items = [];
    }

    function formatPurchaseDescription() { 
      if (!session.creditor) return "...";
      return [
        "PO",
        session.hr_id,
        session.date,
        session.creditor.name
      ].join('/');
    }

    function selectCreditor(creditor) { 
      
      // Get creditors location
      session.location = $scope.creditorLocation.get(creditor.location_id);
      session.purchase.note = formatPurchaseDescription();
      settupPurchase();
    }

    function settupPurchase() { 
      // TODO ensure previous purchase is removed etc.
      session.items = [];
      
      // Initial purchase item 
      addPurchaseItem();
    }
  
    // FIXME
    function getDate() {
      
      //Format the current date according to RFC3339 (for HTML input[type=="date"])
      var now = new Date();
      return now.getFullYear() + "-" + ('0' + (now.getMonth() + 1)).slice(-2) + "-" + ('0' + now.getDate()).slice(-2);
    }

    function addPurchaseItem() { 
      var item = new PurchaseItem();

      session.items.push(item);
      return item;
    }

    function removePurchaseItem(index) { 
      var currentItem = session.items[index];
      
      if (currentItem.inventoryReference) { 
        $scope.inventory.post(currentItem.inventoryReference);
        $scope.inventory.recalculateIndex();
      }
      session.items.splice(index, 1);
    }

    function updatePurchaseItem(purchaseItem, inventoryReference) { 
      if(purchaseItem.inventoryReference) { 
        $scope.inventory.post(purchaseItem.inventoryReference);
        $scope.inventory.recalculateIndex();
      }
      purchaseItem.set(inventoryReference); 
      purchaseItem.inventoryReference = inventoryReference;
      
      // Remove option to select duplicates
      $scope.inventory.remove(inventoryReference.uuid);
      $scope.inventory.recalculateIndex();
    }

    function purchaseTotal() { 
      return session.items.reduce(priceMultiplyQuantity, 0);
    }

    function priceMultiplyQuantity(a, b) { 
      a = (a.quantity * a.price) || a;
      return (b.code) ? a + (b.quantity * b.price) : a; 
    }

    function verifyPurchase(items) { 

      // Ensure creditor selected and items initialised
      if(!items || !items.length) return true;
      
      // Verfiy individual items
      return items.some(function (item) { 
        if(!item.code) return true;
        return false;
      });
    }

    function submitPurchase() { 
      var purchase = connect.clean(session.purchase);
      
      purchase.cost = purchaseTotal();
     
      // FIXME
      purchase.currency_id = appstate.get('enterprise').currency_id;
      purchase.creditor_uuid = session.creditor.creditor_uuid;
      purchase.purchaser_id = $scope.user.data.id;
      purchase.project_id = appstate.get('project').id;
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
          unit_price : item.price,
          total : item.quantity * item.price
        };
        console.log('item', item);
        return connect.basicPut('purchase_item', [writeItem], ['uuid']);
      });

      console.log('wr', writeRequest);

      $q.all(writeRequest)
      .then(function (result) { 
        deferred.resolve(result);
      })
      .catch(function (error) { 
        deferred.reject(error); 
      });
      return deferred.promise;
    }

    function writeSuccess(result) { 
      messenger.success($translate('PURCHASE.WRITE_SUCCESS'));
    }

    function handleError(error) { 
      messenger.danger($translate('PURCHASE.WRITE_FAILED'));
      throw error;
    }

    /*-------------------------------*/
    function PurchaseItem() {
      var self = this;

      function set(inventoryReference) {
        var defaultPrice = inventoryReference.price;

        self.quantity = self.quantity || 1;
        self.code = inventoryReference.code;
        self.text = inventoryReference.text;

        // FIXME naive rounding - ensure all entries/ exits to data are rounded to 4 DP
        self.price = Number(inventoryReference.price.toFixed(4));
        self.inventoryId = inventoryReference.uuid;
        self.note = "";
        self.isSet = true;
      }

      this.quantity = 0,
      this.code = null,
      this.inventoryId = null,
      this.price = null,
      this.text = null,
      this.note = null,
      this.set = set;

      return this;
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
