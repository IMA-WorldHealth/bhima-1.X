angular.module('kpk.controllers').controller('sales', function($scope, $q, $location, $http, $routeParams, validate, connect, appstate, messenger) {
 
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
    
    validate.
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
    invoice.items.splice(index, 1);
  }

  function submitInvoice() { 
    var invoiceRequest = packageInvoiceRequest();
    
    if(!validSaleProperties(invoiceRequest)) return;
    $http.post('sale/', invoiceRequest).then(handleSaleResponse); 
  }
  
  function packageInvoiceRequest() { 
    var requestContainer = {};
    
    //Seller ID will be inserted on the server
    requestContainer.sale = { 
      enterprise_id : appstate.get('enterprise').id,
      cost : calculateTotal(),
      currency_id : appstate.get('enterprise').currency_id,
      debitor_id : invoice.debtor.id,
      invoice_date : invoice.date,
      note : invoice.note
    }; 

    requestContainer.saleItems = [];
    
    invoice.items.forEach(function(saleItem) { 
      var formatSaleItem;

      formatSaleItem = { 
        inventory_id : saleItem.inventoryId,
        quantity : saleItem.quantity,
        unit_price : saleItem.price,
        total : saleItem.quantity * saleItem.price
      }
      requestContainer.saleItems.push(formatSaleItem);
    });
    return requestContainer;
  }

  function handleSaleResponse(result) { 
    $location.path('/invoice/sale/' + result.data.saleId);
  }

  function validSaleProperties(saleRequest) { 
    var sale = saleRequest.sale, saleItems = saleRequest.saleItems;
    var validItems;

    //Check sale item properties
    if(saleItems.length===0) { 
      messenger.danger("[Invalid Sale] No sale items found");
      return false;
    }

    invalidItems = saleItems.some(function(saleItem) { 
      for(property in saleItem) { 
        console.log('checking property', property);
        if(angular.isUndefined(saleItem[property]) || saleItem[property]===null) return true;
      }
      console.log('saleItem', saleItem);
      if(isNaN(Number(saleItem.quantity))) return true;
      if(isNaN(Number(saleItem.unit_price))) return true;
      return false;
    });
    
    if(invalidItems) { 
      messenger.danger("[Invalid Sale] Sale items contain null values");
      return false;
    }
    return true;
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
  
  function calculateTotal() { 
    var total = 0; 
    
    if(!invoice.items) return;
    invoice.items.forEach(function(item) {
      if(item.quantity && item.price) { 
        //FIXME this could probably be calculated less somewhere else (only when they change)
        total += (item.quantity * item.price);
      }
    });
    return total;
  }

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
    var self = this;

    function set(inventoryReference) { 
      self.quantity = self.quantity || 1;
      self.code = inventoryReference.code;
      self.text = inventoryReference.text;
      self.price = inventoryReference.price;
      self.inventoryId = inventoryReference.id;
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

  $scope.initialiseSaleDetails = initialiseSaleDetails;
  $scope.addInvoiceItem = addInvoiceItem;
  $scope.updateInvoiceItem = updateInvoiceItem;
  $scope.removeInvoiceItem = removeInvoiceItem;
  $scope.submitInvoice = submitInvoice;
  $scope.calculateTotal = calculateTotal;
});
