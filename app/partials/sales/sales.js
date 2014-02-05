angular.module('kpk.controllers').controller('sales', function($scope, $q, $location, $routeParams, validate, connect, appstate, messenger) {
 
  //TODO Pass default debtor and inventory parameters to sale modules
  var dependencies = {}, invoice = {}, inventory = [];

  dependencies.sale = { 
    query : '/max/id/sale'
  };

  dependencies.inventory = { 
    required: true,
    query: { tables: {"inventory" : {columns: ["id", "code", "text", "price"]}}}
  };

  //Temporary seller ID, should happen on the server
  dependencies.seller = { 
    query : 'user_session'
  }

  validate.process(dependencies).then(sales);

  function sales(model) { 
    
    //Expose model to scope
    $scope.model = model;
    $scope.inventory = inventory = model.inventory.data;
  }

  function initialiseSaleDetails(selectedDebtor) { 
    if(!selectedDebtor) return messenger.danger('No invoice debtor selected');
    
    invoice = { 
      debtor : selectedDebtor,
      id : createId($scope.model.sale.data.max),
      date : getDate(),
      items: []
    };
    invoice.note = formatNote(invoice);
    addInvoiceItem(); //Default invoice item
    
    $scope.invoice = invoice;
  }
    
  //TODO split inventory management into a seperate controller
  function addInvoiceItem() { 
    invoice.items.push(new InvoiceItem());
  }

  function updateInvoiceItem(invoiceItem, inventoryReference) { 
    invoiceItem.set(inventoryReference);   
  }

  function removeInvoiceItem(index) { 
    console.log('delete request for', index);
    invoice.items.splice(index, 1);
  }
  
  //Utility methods 
  
  //Guess transaction ID, this will not be used writing the transaction to the database
  function createId(current) { 
    var defaultId = 1;
    return (current + 1) || defaultId;
  }

  function getDate() { 
    //Format the current date according to RFC3339
    var currentDate = new Date();
    return currentDate.getFullYear() + "-" + (currentDate.getMonth() + 1) + "-" + ('0' + currentDate.getDate()).slice(-2);
  }
   
  function formatNote(invoice) { 
    var noteDebtor = invoice.debtor || "";
    return "PI/" + invoice.id + "/" + invoice.date + "/" + noteDebtor.name; 
  }
  
  function submitInvoice() { 

  }

  //#sfount - refactor from here

  $scope.generateInvoice = function() { 
    //Client validation logic goes here - should be complimented with server integrity checks etc.
//      FIXME use reduce here
    var t = 0;
    for(var i = 0, l = invoice.items.length; i < l; i++) { t += invoice.items[i].quantity * invoice.items[i].price;
    }

    //create invoice record
    var format_invoice = {
      enterprise_id : appstate.get("enterprise").id, //not safe
      cost : t,
      currency_id : appstate.get('enterprise').currency_id, //ohgd
      debitor_id : invoice.debtor.id,
      invoice_date: invoice.date,
      seller_id : $scope.model.seller.data.id, //TODO placeholder - this should be derived from appstate (session) or equivelant
      discount: '0', //placeholder
      note : invoice.note,
      posted : '0'
    };

//      Generate Invoice first for foreign key constraints, then create invoice items individually
    connect.basicPut('sale', [format_invoice])
    .then(function(res) { 
      if (res.status==200) { 
        var saleId = res.data.insertId, promise = generateInvoiceItems(saleId);
        promise.then(function(res) { 
          console.log("Invoice successfully generated", res);
          // assuming success - if an error occurs sale should be removed etc.
          journalPost(saleId)
          .then(function(res) {
            //everything is good - if there is an error here, sale should be undone (refused from posting journal)
            console.log("posting returned", res);
            // $location.path('/sale_records/' + $scope.invoice_id);
            
            //Replaced path to sale records with receipt
            $location.path('/invoice/sale/' + saleId);
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
  
  //TODO Send all invoice items at once
  function generateInvoiceItems(saleId) { 
    var deferred = $q.defer();
    var promise_arr = [];

    //iterate through invoice items and create an entry to sale_item
    invoice.items.forEach(function(item) { 
      var format_item = {
        sale_id : saleId,
        inventory_id : item.inventoryId,
        quantity : item.quantity,
        unit_price : item.price,
        total : item.quantity * item.price
      };
      console.log("Generating sale item for ", item, format_item);
      
      promise_arr.push(connect.basicPut('sale_item', [format_item]));
    });

    $q.all(promise_arr).then(function(res) { deferred.resolve(res); });
    return deferred.promise;
  }

  $scope.invoiceTotal = function() { 
    if(!invoice.items) return;
    var total = 0;
    invoice.items.forEach(function(item) {
      if(item.quantity && item.price) { 
        //FIXME this could probably be calculated less somewhere else (only when they change)
        total += (item.quantity * item.price);
      }
    });
    return total;
  };

  
  $scope.isPayable = function() { 
    if($scope.invoice.payable=="true") return true;
    return false;
  };

  $scope.itemsInInv = function() { 
    if($scope.inventory.length>0) return true;
    return false;
  };
 
  //TODO clean up invoice item set properties
  function InvoiceItem() { 
    
    function set(inventoryReference) { 
      this.quantity = this.quantity || 1;
      this.code = inventoryReference.code;
      this.text = inventoryReference.text;
      this.price = inventoryReference.price;
      this.inventoryId = inventoryReference.id;
      this.note = "";

      this.isSet = true;
    }

    return {  
      quantity: 0,
      code: null,
      inventoryId: null,
      price: null,
      text: null,
      note: null,
      set: set
    }
  }

  $scope.initialiseSaleDetails = initialiseSaleDetails;
  $scope.addInvoiceItem = addInvoiceItem;
  $scope.updateInvoiceItem = updateInvoiceItem;
  $scope.removeInvoiceItem = removeInvoiceItem;
});
