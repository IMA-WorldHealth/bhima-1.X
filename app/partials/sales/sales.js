angular.module('kpk.controllers').controller('salesController', function($scope, $q, $location, connect, appstate) {
    // TODO
    //  - selecting a debitor should either be done through id or name search (Typeahead select)
    //  - An Invoice should not be able to include the same item (removed from options for future line items)
    //  - Invoice ID should be updated if an invoice is created in the time since invoice creation - see sockets
    console.log("Sales initialised");

    //Default selection for invoice payable
    $scope.invoice = {payable: "false"};
    //TODO perform logic with local variables and expose once complete
    $scope.sale_date = getDate();
    $scope.inventory = [];

    var INVOICE_TYPE = 2;
    var DEB_CRED_TYPE = 'D'; // FIXME: Inserts the debitor_creditor type into the journal

    var inventory_request = connect.req({'tables' : { 'inventory' : { columns : ['id', 'code', 'text', 'price']}}});

    var max_sales_request = connect.basicGet('/max/id/sale');
    var max_purchase_request = connect.basicGet('/max/id/purchase');

    //FIXME should probably look up debitor table and then patients
    //var debtor_request = connect.req('patient', ['debitor_id', 'first_name', 'last_name', 'location_id']);
    //cache location table to look up debitor details
    //var location_request = connect.req('location', ['id', 'city', 'region', 'country_code']);

    var debtor_query = {
        'e' : [{
          t : 'patient',
          c : ['debitor_id', 'first_name', 'last_name', 'location_id']
        }, {
          t : 'location',
          c : ['id', 'city', 'region', 'country_id']
        }],
        'jc' : [{
          ts : ['patient', 'location'],
          c : ['location_id', 'id']
        }]
    };

    var debtor_request = connect.basicReq(debtor_query);
    var user_request = connect.basicGet("user_session");
     
    function init() { 

//      FIXME requests shouldn't be dependent on order
//      FIXME should verify user ID at the time of submitting invoice, less time to manipulate it I guess
      $q.all([
        inventory_request,
        // sales_request,
        debtor_request,
        user_request,
        max_sales_request,
        max_purchase_request
      ]).then(function(a) { 
        $scope.inventory_model = a[0];
        $scope.debtor_model = a[1];
        $scope.verify = a[2].data.id;
        $scope.max_sales = a[3].data.max;
        $scope.max_purchase = a[4].data.max;


        //$scope.debtor = $scope.debtor_model.data[0]; // select default debtor
        var id = Math.max($scope.max_sales, $scope.max_purchase);
        $scope.invoice_id = createId(id);
      });

    }


    //FIXME Shouldn't need to download every all invoices in this module, only take top few?
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
      return "PI " + $scope.invoice_id + "/" + debtor_text + "/" + $scope.sale_date;
    }

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
        currency_id : 1, //ohgd
        debitor_id : $scope.debtor.debitor_id,
        invoice_date: $scope.sale_date,
        seller_id : $scope.verify, //TODO placeholder - this should be derived from appstate (session) or equivelant
        discount: '0', //placeholder
        note : $scope.formatText(),
        posted : '0'
      };

//      Generate Invoice first for foreign key constraints, then create invoice items individually
      connect.basicPut('sale', [format_invoice]).then(function(res) { 
        if(res.status==200) { 
          var promise = generateInvoiceItems();
          promise.then(function(res) { 
            console.log("Invoice successfully generated", res);
            // assuming success - if an error occurs sale should be removed etc.
            journalPost($scope.invoice_id).then(function(res) {
              //everything is good - if there is an error here, sale should be undone (refused from posting journal)
              console.log("posting returned", res);
              $location.path('/sale_records/' + $scope.invoice_id);
            });
          });
        }
      });

      /*
      */
    };

    function journalPost(id) {
      var deferred = $q.defer();
      console.log("POSTING");
      var request = {id: id, transaction_type: INVOICE_TYPE, user: $scope.verify, deb_cred_type: DEB_CRED_TYPE};
      connect.journal([request]).then(function(res) {
        deferred.resolve(res);
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

    $scope.updateItem = function(item) { 
      if(!item.quantity) item.quantity = 1;
      item.text = item.item.text;
      item.price = item.item.price;
    };

    $scope.updateInventory = function() { 
      console.log("Update called");
      var new_line = {item: $scope.inventory_model.data[0]}; //select default item
      $scope.inventory.push(new_line);
      $scope.updateItem(new_line); //force updates of fields
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
    }

    init();
  });
