angular.module('kpk.controllers')
.controller('purchaseOrderController', [
  '$scope',
  '$q',
  'validate',
  'connect',
  'appstate',
  'messenger',
  function($scope, $q, validate, connect, appstate, messenger) {
    var dependencies = {}, inventory = $scope.inventory = [];
    var session = $scope.session = {};
    
    dependencies.inventory = { 
      query : { 
        tables : { 
          inventory : { columns : ['uuid', 'code', 'text', 'price', 'type_id'] }
        }
      }
    };

    session.payable = false;

    var inventory_query = {
      'tables' : {
        'inventory' : {
          'columns' : [ 'uuid', 'code', 'text', 'price', 'type_id']
        }
      },
      'where' : [
        'inventory.type_id=0'
      ]
    };

    var inventory_request = connect.req(inventory_query);

    var creditor_query = {
      tables: {
        'supplier' : { columns : ['uuid', 'name', 'location_id', 'creditor_uuid'] },
      }
    };

    var creditor_request = connect.req(creditor_query);
    var user_request = connect.fetch("user_session");
    var location_request = connect.getModel("/location");

    function init() {

      $scope.inventory = [];
      $scope.creditor = "";

      $q.all([
        inventory_request,
        // sales_request,
        // purchase_request,
        creditor_request,
        user_request,
        location_request

      ]).then(function(a) {
        $scope.inventory_model = a[0];
        $scope.creditor_model = a[1];
        $scope.verify = a[2].data.id;
        $scope.location = a[3];

      });
    }

    function getDate() {
      //Format the current date according to RFC3339 (for HTML input[type=="date"])
      var now = new Date();
      return now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + ('0' + now.getDate()).slice(-2);
    }

    function createId(current) {
      /*
      *summary
      *  Format and increment according to transaction ID format
      */
      var default_id = 100000;
      if(!current) return default_id;
      return current+1;
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
            init();
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

    init();
  }
]);
