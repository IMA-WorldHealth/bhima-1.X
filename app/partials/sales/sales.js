// TODO Global charges currently don't hit an invetory item || account,
// no way of tracing this back to a reason for being
angular.module('kpk.controllers')
.controller('sales', [
  '$scope',
  '$location',
  '$http',
  '$routeParams',
  'validate',
  'connect',
  'appstate',
  'messenger',
  'appcache',
  'precision',
  'uuid',
  function ($scope, $location, $http, $routeParams, validate, connect, appstate, messenger, Appcache, precision, uuid) {
    var dependencies = {},
        invoice = {},
        inventory = [],
        selectedInventory = {};

    var recoverCache = new Appcache('sale'),
        priceListSource = [];

    var session = $scope.session = {
      tablock : -1
    };

    dependencies.inventory = {
      query: {
        identifier : 'uuid',
        tables: {
          "inventory" : {
            columns: ["uuid", "code", "text", "price"]
          }
        }
      }
    };
    
    appstate.register('project', function (project) {
      $scope.project = project;
    });

    recoverCache.fetch('session').then(processRecover);
    validate.process(dependencies).then(sales);

    function sales(model) {
      $scope.model = model;
      $scope.inventory = inventory = model.inventory.data;
    }

    function initialiseSaleDetails(selectedDebtor) {
      console.log(selectedDebtor);
      if(!selectedDebtor) return messenger.danger('No invoice debtor selected');

      // Release previous session items - if they exist
      if(invoice.items) {
        invoice.items.forEach(function (item, index) {
          if(item.code) {
            removeInvoiceItem(index);
          }
        });
      }

      buildInvoice(selectedDebtor);

      // Uncommented patientGroupList - ALL other lists should import price lists from BOTH
      // patientGroupList and debtorGroupList (renamed from priceList)
      dependencies.patientGroupList = {
        query : {
          tables : {
            assignation_patient : {columns : ['patient_group_uuid', 'patient_uuid']},
            patient_group : {columns : ['note']},
            price_list : {columns : ['title']},
            price_list_item : {columns : ['value', 'is_discount', 'is_global', 'description', 'inventory_uuid']}
          },
          join : [
            'assignation_patient.patient_group_uuid=patient_group.uuid',
            'patient_group.price_list_uuid=price_list.uuid',
            'price_list_item.price_list_uuid=price_list.uuid'
          ],
          where : [
            'assignation_patient.patient_uuid=' + selectedDebtor.uuid
          ]
        }
      };

      dependencies.debtorGroupList = {
        query : {
          tables : {
            price_list: { columns : ['uuid', 'title'] },
            price_list_item : { columns : ['value', 'is_discount', 'is_global', 'description', 'inventory_uuid'] }
          },
          join : ['price_list_item.price_list_uuid=price_list.uuid'],
          where : ['price_list.uuid=' + selectedDebtor.price_list_uuid]
        }
      };

      priceListSource = ['patientGroupList', 'debtorGroupList'];
      validate.refresh(dependencies, priceListSource).then(processPriceList);
    }

    function buildInvoice(selectedDebtor) {
      invoice = {
        debtor : selectedDebtor,
        uuid : uuid(),
        date : getDate(),
        items: []
      };

      getCaution(selectedDebtor)
      .then(function (caution){
        if(caution.data.length > 0){
          var somdebit = 0, somcredit = 0;
          caution.data.forEach(function(item){
            somdebit = precision.add(precision.scale(item.debit),somdebit);
            somcredit = precision.add(precision.scale(item.credit),somcredit);
          });

          var debitorCaution = (precision.unscale(somcredit) - precision.unscale(somdebit));
          invoice.debitorCaution = debitorCaution;
        }
        console.log('notre invoice est :', invoice);

        if (session.recovering) {
          recover();
        } else {
          addInvoiceItem();
          session.recovered = null;
        }
        // session.recovering ? recover() : addInvoiceItem();

        invoice.note = formatNote(invoice);
        invoice.displayId = invoice.uuid.substr(0, 13);
        $scope.invoice = invoice;

      });

    }

    function getCaution(selectedDebtor) {
      return connect.fetch('/caution/' + selectedDebtor.debitor_uuid + '/' + $scope.project.id);
    }

    function processPriceList(model) {
      invoice.priceList = [];
      console.log('processPriceList', model);

      // Flattens all price lists fow now, make parsing later simpler
      priceListSource.forEach(function (priceListKey) {
        var priceListData = model[priceListKey].data.sort(sortByOrder);

        priceListData.forEach(function (priceListItem) {
          invoice.priceList.push(priceListItem);
        });
        // invoice.priceList.push(priceListData.sort(sortByOrder));
      });

      // var debtorList = model.debtorGroupList.data;
      // var patientList = model.patientGroupList.data;
      // invoice.priceList = priceLists.sort(function (a, b) { (a.item_order===b.item_order) ? 0 : (a.item_order > b.item_order ? 1 : -1); });
      invoice.applyGlobal = [];

      invoice.priceList.forEach(function (listItem) {
        console.log('g', listItem.is_global, listItem);
        if (listItem.is_global) {
          invoice.applyGlobal.push(listItem);
          console.log(invoice.applyGlobal);
        }
      });
    }

    function sortByOrder(a, b) {
      (a.item_order===b.item_order) ? 0 : (a.item_order > b.item_order) ? 1 : -1;
    }

    //TODO split inventory management into a seperate controller
    function addInvoiceItem() {
      var item = new InvoiceItem();

      invoice.items.push(item);
      return item;
    }

    //TODO rename legacy (previous) reference from inventoryReference
    function updateInvoiceItem(invoiceItem, inventoryReference) {
      if(invoiceItem.inventoryReference) {
        $scope.model.inventory.post(invoiceItem.inventoryReference);
        $scope.model.inventory.recalculateIndex();
      }

      invoiceItem.set(inventoryReference);
      invoiceItem.inventoryReference = inventoryReference;

      //Remove ability to select the option again
      $scope.model.inventory.remove(inventoryReference.uuid);

      $scope.model.inventory.recalculateIndex();

      updateSessionRecover();
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
      console.log('[invoiceRequest]', invoiceRequest);

      if (!validSaleProperties(invoiceRequest)) return;
      $http.post('sale/', invoiceRequest).then(handleSaleResponse);
    }

    function packageInvoiceRequest() {
      var requestContainer = {}, netDiscountPrice, totalCost;

      //Seller ID will be inserted on the server
      requestContainer.sale = {
        project_id : $scope.project.id,
        cost : calculateTotal().total,
        currency_id : $scope.project.currency_id,
        debitor_uuid : invoice.debtor.debitor_uuid,
        invoice_date : invoice.date,
        note : invoice.note
      };

      requestContainer.saleItems = [];

      invoice.items.forEach(function(saleItem) {
        var formatSaleItem;
        formatSaleItem = {
          inventory_uuid : saleItem.inventoryId,
          quantity : saleItem.quantity,
          inventory_price : saleItem.inventoryReference.price,
          transaction_price : saleItem.price,
          credit : Number((saleItem.price * saleItem.quantity).toFixed(4)),
          debit : 0
        };

        requestContainer.saleItems.push(formatSaleItem);
      });
      console.log('cost envoye est :', requestContainer.sale);

      // Patient Groups
      // if(invoice.priceList) {
      //   //TODO Placeholder discount item select, this should be in enterprise settings
      //   var formatDiscountItem, enterpriseDiscountId=12;
      //   formatDiscountItem = {
      //     inventory_id : enterpriseDiscountId,
      //     quantity : 1,
      //     transaction_price : netDiscountPrice,
      //     debit : netDiscountPrice,
      //     credit : 0, //FIXME default values because parser cannot insert records with different columns
      //     inventory_price : 0
      //   };

      invoice.applyGlobal.forEach(function (listItem) {
        var applyCost, formatListItem; // FIXME Derive this from enterprise
        
        console.log('adding listItem', listItem);
        var formatDiscountItem = {
          inventory_uuid : listItem.inventory_uuid,
          quantity : 1,
          transaction_price : listItem.currentValue,
          debit : 0,
          credit : 0,
          inventory_price : 0
        };

        console.log('[FORMAT DISCOUNT ITEM] ', formatDiscountItem);

        formatDiscountItem[listItem.is_discount ? 'debit' : 'credit'] = listItem.currentValue;
        /*
        (listItem.is_discount) ?
          formatDiscountItem.debit = listItem.currentValue :
          formatDiscountItem.credit = listItem.currentValue;
        */

        requestContainer.saleItems.push(formatDiscountItem);
      });

      requestContainer.caution = (invoice.debitorCaution)? invoice.debitorCaution : 0;


      return requestContainer;
    }

    function handleSaleResponse(result) {
      recoverCache.remove('session');
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
    function getDate() {
      //Format the current date according to RFC3339
      var currentDate = new Date();
      return currentDate.getFullYear() + "-" + (currentDate.getMonth() + 1) + "-" + ('0' + currentDate.getDate()).slice(-2);
    }

    function formatNote(invoice) {
      var noteDebtor = invoice.debtor || "";
      return "PI" + "/" + invoice.date + "/" + noteDebtor.name;
    }

    //TODO Refactor code
    function calculateTotal(includeDiscount) {
      var total = 0;
      includeDiscount = angular.isDefined(includeDiscount) ? includeDiscount : true;

      if(!invoice.items) return;
      invoice.items.forEach(function(item) {
        if(item.quantity && item.price && item.code) {
          //FIXME this could probably be calculated less somewhere else (only when they change)

          total += (item.quantity * item.price);

          total = Number(total.toFixed(4));
        }
      });

      console.log('voici le total obtenue jueste apres la sommation ', total);

      if (invoice.applyGlobal) {
        invoice.applyGlobal.forEach(function (listItem) {
          listItem.currentValue = Number(((total * listItem.value) / 100).toFixed(4));

          if (listItem.is_discount) {
            total -= listItem.currentValue;
          } else {
            total += listItem.currentValue;
          }

          total = Number(total.toFixed(4));
        });
      }

      // Apply caution
      if(invoice.debitorCaution){
        var remaining = 0;
        remaining = total - invoice.debitorCaution;
        totalToPay = (remaining < 0)? 0 : remaining;
        totalToPay = Number(totalToPay.toFixed(4));
      }else{
        totalToPay = total;
      }

      return {total : total, totalToPay : totalToPay};

      // return total;
    }

    $scope.isPayable = function() {
      if($scope.invoice.payable==="true") return true;
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
        var defaultPrice = inventoryReference.price;

        self.quantity = self.quantity || 1;
        self.code = inventoryReference.code;
        self.text = inventoryReference.text;

        // FIXME naive rounding - ensure all entries/ exits to data are rounded to 4 DP
        self.price = Number(inventoryReference.price.toFixed(4));
        self.inventoryId = inventoryReference.uuid;
        self.note = "";

        // Temporary price list logic
        if(invoice.priceList) {
          invoice.priceList.forEach(function (list) {

            if(!list.is_global) {
              if(list.is_discount) {
                console.log('[DEBUG] Applying price list discount ', list.description, list.value);
                self.price -= Math.round((defaultPrice * list.value) / 100);

                // FIXME naive rounding - ensure all entries/ exits to data are rounded to 4 DP
                self.price = Number(self.price.toFixed(4));
              } else {
                console.log('[DEBUG] Applying price list charge ', list.description, defaultPrice, list.value);
                var applyList = (defaultPrice * list.value) / 100;
                console.log(self.price, applyList);
                self.price += applyList;

                // FIXME naive rounding - ensure all entries/ exits to data are rounded to 4 DP
                self.price = Number(self.price.toFixed(4));
                console.log(self.price);
              }
            }
          });
        }

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

    function processRecover(recoveredSession) {
      if(!session) return;

      console.log('loaded recovered session', recoveredSession);
      $scope.session.recovered = recoveredSession;
    }

    function selectRecover() {
      $scope.session.recovering = true;
      $scope.findPatient.forceSelect($scope.session.recovered.patientId);
    }

    function recover() {
      $scope.session.recovered.items.forEach(function (item) {
        var currentItem = addInvoiceItem(), invItem = $scope.model.inventory.get(item.uuid);
        currentItem.selectedReference = invItem.code;
        updateInvoiceItem(currentItem, invItem);
        currentItem.quantity = item.quantity;
      });

      // FIXME this is stupid
      session.displayRecover = true;

      session.recovering = false;
      session.recovered = null;
    }

    function updateSessionRecover() {
      //FIXME currently puts new object on every item, this could be improved
      var recoverObject = session.recoverObject || {
        patientId : invoice.debtor.uuid,
        items : []
      };

      invoice.items.forEach(function (item) {
        if(item.code && item.quantity) recoverObject.items.push({
          uuid : item.inventoryId,
          quantity : item.quantity
        });
      });
      recoverCache.put('session', recoverObject);
    }

    function toggleTablock() {
      (session.tablock===0) ? session.tablock = -1 : session.tablock = 0;
    }

    function cacheQuantity(invoiceItem) {

      if (invoiceItem.quantity==='') return;
      if (isNaN(Number(invoiceItem.quantity))) return;
      updateSessionRecover();
    }

    // Sale verficition first step, disable button until basic criteria are met
    function verifySubmission() {
      var invalidItems = false;

      if (!invoice.items) return true;
      if (!invoice.items.length) return true;

      // FIXME This is a very expensive operation
      invalidItems = invoice.items.some(function (item) {
        if (!item.code && !item.quantity) return true;
      });

      return invalidItems;
    }

    $scope.initialiseSaleDetails = initialiseSaleDetails;
    $scope.addInvoiceItem = addInvoiceItem;
    $scope.updateInvoiceItem = updateInvoiceItem;
    $scope.removeInvoiceItem = removeInvoiceItem;
    $scope.submitInvoice = submitInvoice;
    $scope.calculateTotal = calculateTotal;
    $scope.toggleTablock = toggleTablock;
    $scope.selectRecover = selectRecover;
    $scope.cacheQuantity = cacheQuantity;
    $scope.verifySubmission = verifySubmission;
  }
]);
