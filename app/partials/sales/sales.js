angular.module('kpk.controllers')
.controller('salesController', function($scope, $q, $location, $routeParams, connect, appstate) {
    // TODO
    //  - selecting a debitor should either be done through id or name search (Typeahead select)
    //  - An Invoice should not be able to include the same item (removed from options for future line items)
    //  - Invoice ID should be updated if an invoice is created in the time since invoice creation - see sockets

    //Default selection for invoice payable
    $scope.invoice = {payable: "false"};
    //TODO perform logic with local variables and expose once complete
    $scope.sale_date = getDate();
    $scope.inventory = [];

    var INVOICE_TYPE = 2;
    var DEB_CRED_TYPE = 'D'; // FIXME: Inserts the debitor_creditor type into the journal

    //var inventory_request = connect.req({'tables' : { 'inventory' : { columns : ['id', 'code', 'text', 'price']}}});
	
		var paramInventoryId, paramDebtorId;

    var max_sales_request = connect.basicGet('/max/id/sale');
    var max_purchase_request = connect.basicGet('/max/id/purchase');

    //FIXME should probably look up debitor table and then patients
    //var debtor_request = connect.req('patient', ['debitor_id', 'first_name', 'last_name', 'location_id']);
    //cache location table to look up debitor details
    //var location_request = connect.req('location', ['id', 'city', 'region', 'country_code']);
		

    var debitor_query = {
      tables : {
        "patient" : {columns : ["id", "debitor_id", "first_name", "last_name", "location_id"]},
        "debitor" : { columns : ["text"]},
        "debitor_group" : {columns : ["price_list_id"]}
        // "location" : {columns: ["village_id", "sector_id", "province_id", "country_id"]},
        // "village" : {columns: ["id", "name"]}
      },
      join : ["patient.debitor_id=debitor.id", "debitor.group_id=debitor_group.id"]
    };
    
    //This is stupid, location should either come with debtors (aliasing columns) or be downloaded on selection (query single location)
    var location_request = connect.getModel('/location'); 

    var debtor_request = connect.req(debitor_query);
    var user_request = connect.basicGet("user_session");
     
    function init() { 

//      FIXME should verify user ID at the time of submitting invoice, less time to manipulate it I guess
			paramInventoryId = $routeParams.inventoryID;
			paramDebtorId = $routeParams.debtorID; 
			
			$q.all([
        debtor_request,
        user_request,
        max_sales_request,
        max_purchase_request,
        location_request
      ]).then(function(a) {
        $scope.debitor_store = a[0];
        $scope.debtor_model = a[0].data;
        $scope.verify = a[1].data.id;
        $scope.max_sales = a[2].data.max;
        $scope.max_purchase = a[3].data.max;
        $scope.location_model = a[4];
        $scope.inventory = [];
       
        //$scope.debtor = $scope.debtor_model.data[0]; // select default debtor
        var id = Math.max($scope.max_sales, $scope.max_purchase);
        $scope.invoice_id = createId(id);
        console.log($scope.debitor_store);
				generateRouteInvoice();
      });

    }
	
		//If route parameters provided, create default invoice
		function generateRouteInvoice() { 
			//validate route parameters
			console.log(paramDebtorId, paramInventoryId, !!paramDebtorId, !!paramInventoryId);
      //super cryptic - if either boolean value is false, it's hot or some excuse
			if(!(!!paramDebtorId && !!paramInventoryId)) return;
			$scope.debtor = $scope.debitor_store.get(paramDebtorId);
      $scope.loadInventory();
		}

    //placholder to generate custom IDs, currently just iterates
    function createId(current) { 
      var default_id = 100000;
      if(!current) return default_id;
      return current + 1;
    }

    function getDate() { 
      //Format the current date according to RFC3339 (for HTML input[type=="date"])
      var now = new Date();
      return now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + ('0' + now.getDate()).slice(-2);
    }

    $scope.formatText = function() {
//      FIXME String functions within digest will take hours
      var debtor_text = '';
      if($scope.debtor) debtor_text = $scope.debtor.last_name + '/' + $scope.debtor.first_name;
      return "PI " + [$scope.invoice_id, debtor_text, $scope.sale_date].join('/');
    };

    $scope.loadInventory = function () {
      // FIXME
      // THIS CODE NEEDS MAJOR REFACTORING TO MAKE MORE COMPLETE.
      // Current implimentation works fine, but has a ridiculous branch
      var inventory = {
        tables: {"inventory" : {columns: ["id", "code", "text", "price"]}}
      };

      var price_list;
      $scope.inventory = [];
      if ($scope.debtor && angular.isNumber($scope.debtor.price_list_id)) {
        price_list = {
          identifier: "inventory_id",
          tables : { "price_list" : {columns: ["id", "list_id", "inventory_id", "price", "discount"]}},
          where: ["price_list.list_id="+$scope.debtor.price_list_id]
        };

        $q.all([connect.req(inventory), connect.req(price_list)]).then(function (arr) {
          var inv_store = arr[0];
          var data = arr[0].data; // inventory data
          var store = arr[1]; // price_list store
          inv_store.setData(data.map(function (item) {
            var adjusted = store.get(item.id);
            if (adjusted) item.price = adjusted.price;
            return item;
          }));
          $scope.inventory_model = inv_store;
        });
      } else {
        connect.req(inventory).then(function (store) {
          $scope.inventory_model = store;
        });
      }

      $scope.currentLocation = $scope.location_model.get($scope.debtor.location_id);
    };

    $scope.generateInvoice = function() { 
      //Client validation logic goes here - should be complimented with server integrity checks etc.
//      FIXME use reduce here
      var t = 0;
      for(var i = 0, l = $scope.inventory.length; i < l; i++) { 
        t += $scope.inventory[i].quantity * $scope.inventory[i].price;
      }

      //create invoice record
      var format_invoice = {
        enterprise_id : appstate.get("enterprise").id, //not safe
        id : $scope.invoice_id,
        cost : t,
        currency_id : appstate.get('enterprise').currency_id, //ohgd
        debitor_id : $scope.debtor.debitor_id,
        invoice_date: $scope.sale_date,
        seller_id : $scope.verify, //TODO placeholder - this should be derived from appstate (session) or equivelant
        discount: '0', //placeholder
        note : $scope.formatText(),
        posted : '0'
      };

//      Generate Invoice first for foreign key constraints, then create invoice items individually
      connect.basicPut('sale', [format_invoice])
      .then(function(res) { 
        if (res.status==200) { 
          var promise = generateInvoiceItems();
          promise.then(function(res) { 
            console.log("Invoice successfully generated", res);
            // assuming success - if an error occurs sale should be removed etc.
            journalPost($scope.invoice_id)
            .then(function(res) {
              //everything is good - if there is an error here, sale should be undone (refused from posting journal)
              console.log("posting returned", res);
              // $location.path('/sale_records/' + $scope.invoice_id);
              
              //Replaced path to sale records with receipt
              $location.path('/invoice/sale/' + $scope.invoice_id);
            }, function (error) {
              console.log("ERROR:", error);
            });
          });
        }
      });

      /*
      */
    };

    function journalPost(id) {
      var deferred = $q.defer();
      connect.fetch('/journal/sale/' + id)
      .then(function(res) {
        deferred.resolve(res);
      }, function (error) {
        deferred.reject(error);  
      });
      return deferred.promise;
    }

    function generateInvoiceItems() { 
      var deferred = $q.defer();
      var promise_arr = [];

      //iterate through invoice items and create an entry to sale_item
      $scope.inventory.forEach(function(item) { 
        var format_item = {
          sale_id : $scope.invoice_id,
          inventory_id : item.item.id,
          quantity : item.quantity,
          unit_price : item.price,
          total : item.quantity * item.price
        };
        console.log("Generating sale item for ", item);

        promise_arr.push(connect.basicPut('sale_item', [format_item]));
      });

      $q.all(promise_arr).then(function(res) { deferred.resolve(res); });
      return deferred.promise;
    }

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

    $scope.updateRow = function (row) { 
      if(!row.quantity) row.quantity = 1;
      row.text = row.item.text;
      row.price = row.item.price;
    };

    $scope.updateInventory = function(inventoryID) {
			//FIXME dont' select default inventory item - have a selct option 
			if(!inventoryID) inventoryID = 0; 
			var new_line = {item: $scope.inventory_model.data[inventoryID]}; //select default item
      $scope.inventory.push(new_line);
      $scope.updateRow(new_line); //force updates of fields
      /* 
      Watching a variable that isn't in angular's scope, return the variable in a function
      $scope.$watch(function() { return new_line.item; }, function(nval, oval, scope) { 
        console.log(nval);
      });*/
    };

    $scope.isPayable = function() { 
      if($scope.invoice.payable=="true") return true;
      return false;
    };

    $scope.itemsInInv = function() { 
      if($scope.inventory.length>0) return true;
      return false;
    };

    $scope.formatDebtor = function(debtor) {
      return "[" + debtor.debitor_id + "] " + debtor.first_name + " " + debtor.last_name;
    };

    init();
  });
