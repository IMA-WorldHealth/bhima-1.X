angular.module('kpk.controllers')
.controller('purchaseOrderController', [
  '$scope',
  '$q',
  'validate',
  'connect',
  'appstate',
  'messenger',
  'uuid',
  function($scope, $q, validate, connect, appstate, messenger) {

    // TODO Currently downloads every location - should only download the 
    // selected creditors location
    var dependencies = {}, inventory = $scope.inventory = [];
    var session = $scope.session = {};
    
    dependencies.inventory = { 
      query : { 
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

    dependencies.creditorLocation = { 
      query : '/location'
    };

    session.purchase = { 
      payable : false,
      date : getDate()
    };
    session.selected = false;
    
    validate.process(dependencies).then(initialise);
    
    function initialise(model) { 
      
      // Expose models to the scope
      angular.extend($scope, model);
      console.log(model);
    }
  
    // FIXME
    function getDate() {
      
      //Format the current date according to RFC3339 (for HTML input[type=="date"])
      var now = new Date();
      return now.getFullYear() + "-" + ('0' + (now.getMonth() + 1)).slice(-2) + "-" + ('0' + now.getDate()).slice(-2);
    }
    
    function formatInvoice() {
      var t = 0;
      for(var i= 0, l = $scope.inventory.length; i < l; i+=1) {
        t += $scope.inventory[i].quantity * $scope.inventory[i].price;
      }
  //    verify total

      var format = {
        enterprise_id : appstate.get("enterprise").id, //Not async safe - may return null
        id : $scope.invoice_id,
        cost : t,
        currency_id : 1, // FIXME
        creditor_id : $scope.creditor.id,
        invoice_date : $scope.sale_date,
        purchaser_id : $scope.verify,
        note : $scope.formatText(),
        posted : '0'
      };
  //    verify format
      return format;
    }

    function generateItems() {
      var deferred = $q.defer();

      //iterate through invoice items and create an entry to sale_item
      var promise_arr = $scope.inventory.map(function (item) {
        //console.log("Generating sale item for ", item);
        var format_item = {
          purchase_id : $scope.invoice_id,
          inventory_id : item.item.id,
          quantity : item.quantity,
          unit_price : item.price,
          total : item.quantity * item.price
        };
        return connect.basicPut('purchase_item', [format_item]);
      });

      $q.all(promise_arr).then(function (res) { deferred.resolve(res); });
      return deferred.promise;
    }

    $scope.submitPurchase = function() {
      var purchase = formatInvoice();

      //console.log("Posting", purchase, "to 'purchase table");

      connect.basicPut('purchase', [purchase])
      .then(function(res) {
        var id = res.data.insertId;
        var promise = generateItems();
        promise
        .then(function(res) {
          //console.log("Purchase order successfully generated", res);

          connect.fetch('/journal/purchase/' + purchase.id)
          .then(function (success) {
            messenger.success('Posted purchase id: ' + id);
  //        Navigate to Purchase Order review || Reset form
  //        Reset form
            // init();
          }, function (err) {
            messenger.danger('Posting returned err: ' + JSON.stringify(err));
          });
        });
      });
    };

    $scope.updateItem = function(item) {

      if(item.item) {
        if(!item.quantity) item.quantity = 1;
        item.text = item.item.text;
        item.price = item.item.price;
      } else {
  //      Reset
        item.text = "";
        item.price = "";
        item.quantity = "";
      }
    };

    $scope.updateInventory = function() {
      $scope.inventory.push({});
    };

    $scope.formatText = function() {
  //      FIXME String functions within digest will take hours and years
      var c = "PO " + $scope.invoice_id + "/" + $scope.sale_date;
      if($scope.creditor) c += "/" + $scope.creditor.name + "/";
      return c;
    };

  //  Radio inputs only accept string true/false? boolean value as payable doesn't work
    $scope.isPayable = function() {
      return session.payable;
    };

    // FIXME Again - evaluated every digest, this is a bad thing
    $scope.invoiceTotal = function() {
      var total = 0;
      $scope.inventory.forEach(function(item) {
        if(item.quantity && item.price) {
          //FIXME this could probably be calculated less somewhere else (only when they change)
          total += (item.quantity * item.price);
        }
      });
      return total;
    };

    $scope.itemsInInv = function() {
      if($scope.inventory.length>0) return true;
      return false;
    };

    $scope.select = function(index) {
      $scope.current_process = $scope.process[index];
    };

    $scope.formatCreditor = function(creditor) {
      return creditor.name;
    };

    $scope.updateLocation = function updateLocation(creditor) {
      var loc = $scope.location.get(creditor.location_id);
      $scope.creditor.village = loc.village;
      $scope.creditor.province = loc.province;
    };

    // init();
  }
]);
