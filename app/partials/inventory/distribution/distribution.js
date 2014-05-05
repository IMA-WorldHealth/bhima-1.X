angular.module('kpk.controllers')
.controller('inventory.distribution', [
  '$scope',
  '$translate',
  'validate',
  'connect',
  'messenger',
  'appstate',
  'util',
  'uuid',
  '$q',
  'precision',
  '$http',
  '$location',
  function ($scope, $translate, validate, connect, messenger, appstate, util, uuid, $q, precision, $http, $location) {
    var distribution = {}, dependencies = {}, priceListSource = ['patientGroupList', 'debtorGroupList'];
    distribution.visible = false;
    distribution.noEmpty = false;
    distribution.item_records = [];
    distribution.moving_records = [];
    distribution.rows = [];


    dependencies.stocks = {
      required : true,
      query : {
        tables : {
          'stock' : {
            columns : ['inventory_uuid', 'purchase_price', 'expiration_date', 'entry_date', 'lot_number', 'purchase_order_uuid', 'tracking_number', 'quantity']
          },
          'inventory' : {
            columns : ['uuid', 'text', 'enterprise_id', 'code', 'inventory_code', 'price']
          }
        },
          join : ['stock.inventory_uuid=inventory.uuid']
      }
    };

    function initialiseDistributionDetails (selectedDebitor){
      if(selectedDebitor) distribution.noEmpty = true;
      distribution.selectedDebitor = selectedDebitor;
      addRow();


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
            'assignation_patient.patient_uuid=' + selectedDebitor.uuid
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
          where : ['price_list.uuid=' + selectedDebitor.price_list_uuid]
        }
      };

      window.distribution = distribution;
      getCaution()
      .then(function (caution){
        if(caution.data.length > 0){
          var somdebit = 0, somcredit = 0;
          caution.data.forEach(function(item){
            somdebit = precision.add(precision.scale(item.debit),somdebit);
            somcredit = precision.add(precision.scale(item.credit),somcredit);
          });

          var debitorCaution = (precision.unscale(somcredit) - precision.unscale(somdebit));
          distribution.debitorCaution = debitorCaution;
        }

        // if (session.recovering) {
        //   recover();
        // } else {
        //   addInvoiceItem();
        //   session.recovered = null;
        // }
        // session.recovering ? recover() : addInvoiceItem();
        return $q.when();

      })
      .then(function (){
        validate.refresh(dependencies, priceListSource).then(processPriceList);
      })
    }

    function getCaution() {
      return connect.fetch('/caution/' + $scope.distribution.selectedDebitor.debitor_uuid + '/' + $scope.project.id);
    }

    function init (model){
      $scope.model = model;
    }

    function updateDistributionItem(selectedItem) {
      console.log('item choisi', selectedItem);

      selectedItem.set(selectedItem);
      //invoiceItem.inventoryReference = inventoryReference;

      // //Remove ability to select the option again
      // $scope.model.inventory.remove(inventoryReference.uuid);

      // $scope.model.inventory.recalculateIndex();

      // updateSessionRecover();
    }


    function addRow () {
      distribution.rows.push(new DistributionItem());
    }

    function DistributionItem () {
      this.movement = null;
      this.item = null;
      var self = this;

      function set(row) {
        var defaultPrice = row.item.price;

        self.item.quantity = self.item.amount || 1;
        self.item.code = row.item.code;
        self.item.text = row.item.text;

        // FIXME naive rounding - ensure all entries/ exits to data are rounded to 4 DP
        self.item.price = Number(row.item.price.toFixed(4));
        self.item.inventoryId = row.item.uuid;
        self.item.note = "";

        // Temporary price list logic
        if(distribution.priceList) {
          distribution.priceList.forEach(function (list) {

            if(!list.is_global) {
              if(list.is_discount) {
                self.item.price -= Math.round((defaultPrice * list.value) / 100);
                self.item.price = Number(self.item.price.toFixed(4));
              } else {
                var applyList = (defaultPrice * list.value) / 100;
                self.item.price += applyList;
                // FIXME naive rounding - ensure all entries/ exits to data are rounded to 4 DP
                self.item.price = Number(self.item.price.toFixed(4));
              }
            }
          });
        }
        self.item.isSet = true;
      }

      this.set = set;

      // this.item.document_id = uuid();
      // this.item.tracking_number = null;
      // this.item.date = util.convertToMysqlDate(new Date().toString());
      // this.item.depot_id = null;
      // this.item.amount = null;
      // this.item.text = null;
      // this.item.patient_uuid = $scope.distribution.selectedDebitor.uuid;
      // this.item.movement = new movement(this);
      return this;
    }

    function processPriceList (model) {
      distribution.priceList = [];

      // Flattens all price lists fow now, make parsing later simpler
      priceListSource.forEach(function (priceListKey) {
        var priceListData = model[priceListKey].data.sort(sortByOrder);

        priceListData.forEach(function (priceListItem) {
          distribution.priceList.push(priceListItem);
        });
      });

      distribution.applyGlobal = [];

      distribution.priceList.forEach(function (listItem) {
        if (listItem.is_global) {
          distribution.applyGlobal.push(listItem);
        }
      });
    }

    function sortByOrder(a, b) {
      (a.item_order===b.item_order) ? 0 : (a.item_order > b.item_order) ? 1 : -1;
    }

    function movement (consumption) {
      this.document_id = uuid();
      this.tracking_number = consumption.tracking_number;
      this.direction = 'Exit';
      this.date = consumption.date;
      this.quantity = 0;
      this.depot_id = 1;
      this.destination = 1;
      return this;
    }

    function removeItem(index) {
      distribution.rows.splice(index, 1);
    }

    //TODO Refactor code
    function calculateTotal(includeDiscount) {
      var total = 0;
      includeDiscount = angular.isDefined(includeDiscount) ? includeDiscount : true;

      if(!distribution.rows) return;
      distribution.rows.forEach(function(it) {
        if(it.item.amount && it.item.price && it.item.code) {

          total += (it.item.amount * it.item.price);

          total = Number(total.toFixed(4));
        }
      });

      if (distribution.applyGlobal) {
        distribution.applyGlobal.forEach(function (listItem) {
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
      if(distribution.debitorCaution){
        var remaining = 0;
        remaining = total - distribution.debitorCaution;
        totalToPay = (remaining < 0)? 0 : remaining;
        totalToPay = Number(totalToPay.toFixed(4));
      }else{
        totalToPay = total;
      }

      return {total : total, totalToPay : totalToPay};
    }

    function formatNote(distribution) {
      var noteDebitor = distribution.selectedDebitor || "";
      return "PI" + "/" + distribution.moving_records.date + "/" + noteDebitor.name;
    }

    function packageSaleRequest() {
      var requestContainer = {}, netDiscountPrice, totalCost;

      //Seller ID will be inserted on the server
      requestContainer.sale = {
        project_id : $scope.project.id,
        cost : calculateTotal().total,
        currency_id : $scope.project.currency_id,
        debitor_uuid : distribution.selectedDebitor.debitor_uuid,
        invoice_date : util.convertToMysqlDate(new Date().toString()),
        note : formatNote(distribution)
      };

      requestContainer.saleItems = [];

      distribution.rows.forEach(function(saleItem) {
        var formatSaleItem;
        formatSaleItem = {
          inventory_uuid : saleItem.item.inventory_uuid,
          quantity : saleItem.item.amount,
          inventory_price : saleItem.item.price,
          transaction_price : saleItem.item.price,
          credit : Number((saleItem.item.price * saleItem.item.amount).toFixed(4)),
          debit : 0
        }
        requestContainer.saleItems.push(formatSaleItem);
      });

      distribution.applyGlobal.forEach(function (listItem) {
        var applyCost, formatListItem; // FIXME Derive this from enterprise

        var formatDiscountItem = {
          inventory_uuid : listItem.inventory_uuid,
          quantity : 1,
          transaction_price : listItem.currentValue,
          debit : 0,
          credit : 0,
          inventory_price : 0
        };

        formatDiscountItem[listItem.is_discount ? 'debit' : 'credit'] = listItem.currentValue;

        requestContainer.saleItems.push(formatDiscountItem);
      });

      requestContainer.caution = (distribution.debitorCaution)? distribution.debitorCaution : 0;


      return requestContainer;
    }

    function sanitize (){
      distribution.item_records = distribution.rows.map(function (it){
        return {
          document_id : uuid(),
          tracking_number : it.item.tracking_number,
          date : util.convertToMysqlDate(new Date().toString()),
          depot_id : 1,
          amount : it.item.amount,
          patient_uuid : $scope.distribution.selectedDebitor.uuid
        };
      });

      distribution.moving_records = distribution.rows.map(function (it){
        return {
          document_id : uuid(),
          tracking_number : it.item.tracking_number,
          direction : 'Exit',
          date : util.convertToMysqlDate(new Date().toString()),
          quantity : it.item.amount,
          depot_id : 1, //for now
          destination : 1 //for patient
        };
      });

    }

    function submit (){
      sanitize();
      doMovingStock()
      .then(doSale)
      .then(function(result){
      });
      //.then(doSale());

    }

    function doMovingStock (){
      return $q.all(connect.basicPut('consumption', distribution.item_records), connect.basicPut('stock_movement', distribution.moving_records));
    }

    function doSale (res){
      var saleRequest = packageSaleRequest();
      $http.post('sale/', saleRequest).then(handleSaleResponse);
    }

    function handleSaleResponse(result) {
      //recoverCache.remove('session');
      $location.path('/invoice/sale/' + result.data.saleId);
    }

    function verifySubmission (){

    }

    appstate.register('project', function (project) {
      $scope.project = project;
      validate.process(dependencies)
      .then(init)
      .catch(function (error) {
        console.error(error);
      });
    });

    //exposition
    $scope.distribution = distribution;
    $scope.initialiseDistributionDetails = initialiseDistributionDetails;
    $scope.addRow = addRow;
    $scope.removeItem = removeItem;
    $scope.submit = submit;
    $scope.verifySubmission = verifySubmission;
    $scope.calculateTotal = calculateTotal;
    $scope.updateDistributionItem = updateDistributionItem;
  }
]);
