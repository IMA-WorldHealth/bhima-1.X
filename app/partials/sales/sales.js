angular.module('kpk.controllers').controller('sales', function($scope, $q, $location, $http, $routeParams, validate, connect, appstate, messenger) {

  //TODO Pass default debtor and inventory parameters to sale modules
  var dependencies = {}, invoice = {}, inventory = [], selectedInventory = {};

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
  };

  validate.process(dependencies).then(sales);

  function sales(model) {
    //Expose model to scope
    $scope.model = model;
    $scope.inventory = inventory = model.inventory.data;
  }

  function initialiseSaleDetails(selectedDebtor) {
    if(!selectedDebtor) return messenger.danger('No invoice debtor selected');
   
    buildInvoice(selectedDebtor);
   
    dependencies.priceList = {
      query : {
        tables : {
          assignation_patient : {columns : ['patient_group_id', 'patient_id']},
          patient_group : {columns : ['note']},
          price_list : {columns : ['id', 'name', 'discount', 'note']}
        },
        join : [
          'assignation_patient.patient_group_id=patient_group.id',
          'patient_group.price_list_id=price_list.id'
        ],
        where : [
          'assignation_patient.patient_id=' + 1
        ]
      }
    };
   
    validate.refresh(dependencies, ['priceList']).then(processPriceList);
  }

  function buildInvoice(selectedDebtor) {
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

  function processPriceList(model) {
    var selectedPriceList, priceLists = model.priceList.data;
     
    //naive implementation of resolving multiple price lists
    selectedPriceList = priceLists.sort(function(a, b) { return a.discount < b.discount; })[0];
    if(selectedPriceList) invoice.priceList = selectedPriceList;
  }
   
  //TODO split inventory management into a seperate controller
  function addInvoiceItem() {
    invoice.items.push(new InvoiceItem());
  }
  
  //TODO rename legacy (previous) reference from inventoryReference
  function updateInvoiceItem(invoiceItem, inventoryReference) {
    if(invoiceItem.inventoryReference) { 
      $scope.model.inventory.post(invoiceItem.inventoryReference);
      $scope.model.inventory.recalculateIndex();
    }

    invoiceItem.set(inventoryReference);
    invoiceItem.inventoryReference = inventoryReference;
  
    //Remove ability to selec the option again 
    $scope.model.inventory.remove(inventoryReference.id);
    $scope.model.inventory.recalculateIndex();
  }

  function removeInvoiceItem(index) {
    var selectedItem = invoice.items[index];

    if(selectedItem.inventoryReference) { 
      $scope.model.inventory.post(selectedItem.inventoryReference);
      $scope.model.inventory.recalculateIndex();
    }

    invoice.items.splice(index, 1);
  }

  function submitInvoice() {
    var invoiceRequest = packageInvoiceRequest();
   
    if(!validSaleProperties(invoiceRequest)) return;
    $http.post('sale/', invoiceRequest).then(handleSaleResponse);
  }
 
  function packageInvoiceRequest() {
    var requestContainer = {}, netDiscountPrice, totalCost;
    
    //Seller ID will be inserted on the server
    requestContainer.sale = {
      enterprise_id : appstate.get('enterprise').id,
      cost : calculateTotal(),
      currency_id : appstate.get('enterprise').currency_id,
      debitor_id : invoice.debtor.id,
      invoice_date : invoice.date,
      note : invoice.note
    };

   
    if(invoice.priceList) {
       //TODO Hacky
      netDiscountPrice = (calculateTotal(false) < invoice.priceList.discount) ? calculateTotal(false) : invoice.priceList.discount;
      requestContainer.sale.discount = netDiscountPrice;
    }

    requestContainer.saleItems = [];
   
    invoice.items.forEach(function(saleItem) {
      var formatSaleItem;
      formatSaleItem = {
        inventory_id : saleItem.inventoryId,
        quantity : saleItem.quantity,
        inventory_price : saleItem.inventoryReference.price,
        transaction_price : saleItem.price,
        credit : saleItem.price * saleItem.quantity,
        debit : 0
      };

      requestContainer.saleItems.push(formatSaleItem);
    });
   
    if(invoice.priceList) {
      //TODO Placeholder discount item select, this should be in enterprise settings
      var formatDiscountItem, enterpriseDiscountId=12;
     
      formatDiscountItem = {
        inventory_id : enterpriseDiscountId,
        quantity : 1,
        transaction_price : netDiscountPrice,
        debit : netDiscountPrice,
        credit : 0, //FIXME default values because parser cannot insert records with different columns
        inventory_price : 0
      };
     
      requestContainer.saleItems.push(formatDiscountItem);
    }

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
        if(angular.isUndefined(saleItem[property]) || saleItem[property]===null) return true;
      }
      if(isNaN(Number(saleItem.quantity))) return true;
      if(isNaN(Number(saleItem.transaction_price))) return true;
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

  //TODO Refactor code
  function calculateTotal(includeDiscount) {
    var total = 0;
    includeDiscount = angular.isDefined(includeDiscount) ? includeDiscount : true;
   
    if(!invoice.items) return;
    invoice.items.forEach(function(item) {
      if(item.quantity && item.price) {
        //FIXME this could probably be calculated less somewhere else (only when they change)
        total += (item.quantity * item.price);
      }
    });
 
    if(includeDiscount) {
      if(invoice.priceList) total -= invoice.priceList.discount;
      if(total < 0) total = 0;
    }
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
