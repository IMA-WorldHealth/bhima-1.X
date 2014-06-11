angular.module('bhima.controllers')
.controller('stock.distribution', [
  '$scope',
  '$q',
  '$routeParams',
  'validate',
  'connect',
  'messenger',
  'appstate',
  'util',
  'uuid',
  function ($scope, $q, $routeParams, validate, connect, messenger, appstate, util, uuid) {
    var session = $scope.session = {
      // FIXME
      index : -1,
      state : null,
      depot : $routeParams.depotId
    };
    var distribution = {}, dependencies = {};

    // Test for module organised into step structure
    var moduleDefinition = $scope.moduleDefinition = [
      {
        title : 'Locate Patient',
        template : 'patientSearch.tmpl.html',
        method : findPatient
      },
      {
        title : 'Select prescription sale',
        template : 'selectSale.tmpl.html',
        method : findPatient
      },
      {
        title : 'Allocate medicine',
        template : 'allocateLot.tmpl.html',
        method : findPatient
      }
    ];

    dependencies.ledger = {};
    
    moduleStep();

    function initialiseDistributionDetails(patient) {
      console.log(patient);
      dependencies.ledger.query = '/ledgers/debitor/' + patient.debitor_uuid;
      session.patient = patient;
      validate.process(dependencies).then(startup);
    }
    
    function startup(model) {
      angular.extend($scope, model);
      
      moduleStep();
      console.log(model);
    }

    function moduleStep() { 
      
      // FIXME
      session.index += 1;
      session.state = moduleDefinition[session.index];
      session.state.method();
    }

    function selectSale(sale) {
      session.sale = sale;

      moduleStep();

      getSaleDetails(sale).then(function (saleDetails) {
        var detailsRequest = [];
        session.sale.details = saleDetails.data;
        
        detailsRequest = session.sale.details.map(function (saleItem) {
          return connect.req('inventory/depot/' + session.depot + '/drug/' + saleItem.code);
        });

        $q.all(detailsRequest).then(function (result) {
          console.log('got all lot details');
          session.sale.details.forEach(function (saleItem, index) {
            var itemModel = result[index];

            console.log('assigning', result);
            if (itemModel.data.length) saleItem.lots = itemModel;
          });

          recomendLots(session.sale.details);
        })
        .catch(function (error) {
          messenger.error(error);
        });
      });
    }

    function recomendLots(saleDetails) {
      // Corner cases 
      // - ! Lot exists but does not have enough quantity to provide medicine
      // - No lots exist, warning status
      // - ! Lot exists but is expired, stock administrator
      // - Lot exists with both quantity and expiration date 
      saleDetails.forEach(function (saleItem) { 
        // Check to see if any lots exist (expired stock should be run through the stock loss process)
        if (!saleItem.lots) return; 

        // If lots exist, order them by experiation and quantity 
        saleItem.lots.data.sort(orderLotsByUsability);
         
        // Validate candidates if none are suitable, update status

      });
    }

    function orderLotsByUsability(a, b) {  
      // Order first by expiration date, then by quantity
      console.log('a', a, 'b', b);  
    };

    function getSaleDetails(sale) {
      console.log('sale', sale);
      var query = {
        tables : {
          sale_item : {
            columns : ['sale_uuid', 'uuid', 'inventory_uuid', 'quantity']
          },
          inventory : {
            columns : ['code', 'text', 'consumable']
          }
        },
        where : ['sale_item.sale_uuid=' + sale.inv_po_id],
        join : ['sale_item.inventory_uuid=inventory.uuid']
      };

      return connect.req(query);
    }

    function init() { 

    }

    function findPatient() { 

    }

    $scope.selectSale = selectSale;
    $scope.initialiseDistributionDetails = initialiseDistributionDetails;
    // distribution.visible = true;
    // distribution.noEmpty = false;
    // distribution.item_records = [];
    // distribution.moving_records = [];
    // distribution.rows = [];
    // distribution.sales = [];


    // dependencies.stocks = {
    //   query : {
    //     tables : {
    //       'stock' : {
    //         columns : ['inventory_uuid', 'expiration_date', 'entry_date', 'lot_number', 'purchase_order_uuid', 'tracking_number', 'quantity']
    //       },
    //       'inventory' : {
    //         columns : ['uuid', 'text', 'enterprise_id', 'code', 'price', 'stock']
    //       }
    //     },
    //     join : ['stock.inventory_uuid=inventory.uuid']
    //   }
    // };

    // dependencies.project = {
    //   required : true,
    //   query : {
    //     tables : {
    //       'project' : {
    //         columns : ['abbr', 'name']
    //       }
    //     }
    //   }
    // };

    // dependencies.debitor_group = {
    //   required : true,
    //   query : {
    //     tables : {
    //       'debitor_group' : {
    //         columns : ['is_convention', 'name', 'uuid', 'account_id']
    //       }
    //     }
    //   }
    // };

    // function initialiseDistributionDetails (selectedDebitor){
    //   if(!selectedDebitor) return;
    //   distribution.noEmpty = true; $scope.ready = 'ready';
    //   distribution.selectedDebitor = selectedDebitor;
    //   connect.fetch('/ledgers/distributableSale/' + selectedDebitor.debitor_uuid)
    //   .then(function (data) {
    //     data.forEach(function (row) {
    //       row.reference = getAbbr(row.project_id)+row.reference;
    //       row.etat = getState(row);
    //     });
    //     distribution.sales = data;
    //   });
    //   window.distribution = distribution;
    // }

    // function getAbbr(project_id){
    //   return $scope.model.project.data.filter(function (item){
    //     return item.id = project_id;
    //   })[0].abbr;
    // }

    // function getState (sale){
    //   return ($scope.model.debitor_group.data.filter(function (item) {
    //     return item.account_id == sale.account_id;
    //   })[0].is_convention == 1)? 'CONVENTION' : (sale.balance>0)? 'NON PAYE' : 'PAYE';
    // }

    // function init (model){
    //   //init model
    //   $scope.model = model;
    // }
    // function movement (consumption) {
    //   this.document_id = uuid();
    //   this.tracking_number = consumption.tracking_number;
    //   this.direction = 'Exit';
    //   this.date = consumption.date;
    //   this.quantity = 0;
    //   this.depot_id = 1;
    //   this.destination = 1;
    //   return this;
    // }

    // function sanitize (){
    //   distribution.rows = $scope.selectedSale.sale_items;

    //   distribution.item_records = distribution.rows.map(function (it){
    //     it.consumption_infos = [];
    //     var q = it.quantity;
    //     distribution.records = it.lots.map(function (lot){
    //       var record;
    //       if(lot.setted){
    //         if(q>0){
    //           var amount;
    //           if(q-lot.quantity>0){
    //             q-=lot.quantity;
    //             amount = lot.quantity;
    //             lot.current_quantity = 0;
    //           }else{
    //             amount = q;
    //             lot.current_quantity = lot.quantity - q;
    //             q=0;
    //           }
    //           record = {
    //             document_id : uuid(),
    //             tracking_number : lot.tracking_number,
    //             date : util.convertToMysqlDate(new Date().toString()),
    //             depot_id : 1,
    //             amount : amount,
    //             sale_uuid : $scope.selectedSale.inv_po_id
    //           }
    //           it.consumption_infos.push(record);
    //           return record;
    //         }
    //       }
    //     })

    //     return distribution.records = distribution.records.filter(function (item){
    //       return (item)? true : false;
    //     })
    //   })

    //   distribution.moving_records = distribution.rows.map(function (it){
    //     return distribution.records = it.consumption_infos.map(function (consumption_info){

    //           return {
    //             document_id : uuid(),
    //             tracking_number : consumption_info.tracking_number,
    //             direction : 'Exit',
    //             date : util.convertToMysqlDate(new Date().toString()),
    //             quantity : consumption_info.amount,
    //             depot_id : 1, //for now
    //             destination :1 //for patient
    //           }
    //     })
    //   })
    // }

    // function submit (){
    //   sanitize();
    //   if(stockAvailability()){
    //     doConsumption()
    //     .then(doMoving)
    //     //.then(decreaseStock)
    //     .then(function(result){
    //       console.log('[result ...]')
    //     });
    //   }else{
    //     messenger.danger('Le stock dans le (s) lot (s) selectionne (s) n\'est pas disponible pour convrir la quantite demandee');
    //   }
    // }

    // function decreaseStock (){
    //   console.log(distribution);
    //   // return $q.all(
    //   //   distribution.item_records.map(function (item_record){
    //   //     return connect.basicPut('consumption', item_record)
    //   //   })
    //   // )
    // }

    // function updateStock (){
    //   validate.refresh(dependencies, ['stock'])
    //   .then(function (model){
    //   })
    // }

    // function doConsumption (){
    //   return $q.all(
    //     distribution.item_records.map(function (item_record){
    //       return connect.basicPut('consumption', item_record)
    //     })
    //   )
    // }

    // function doMoving(){
    //   return $q.all(
    //     distribution.moving_records.map(function (moving){
    //       return connect.basicPut('stock_movement', moving)
    //     })
    //   )
    // }

    // function handleSaleResponse(result) {
    //   //recoverCache.remove('session');
    //   //$location.path('/invoice/sale/' + result.data.saleId);
    // }

    // function add (idx) {
    //   if($scope.selectedSale) return;
    //   $scope.selectedSale =  $scope.distribution.sales.splice(idx, 1)[0];
    //   dependencies.sale_items = {
    //     required : true,
    //     query : {
    //       tables : {
    //         'sale_item' : {columns : ['uuid', 'inventory_uuid', 'quantity']},
    //         'inventory' : {columns : ['code', 'text', 'stock']}
    //       },
    //       join  : ['sale_item.inventory_uuid=inventory.uuid'],
    //       where : ['sale_item.sale_uuid='+$scope.selectedSale.inv_po_id]
    //     }
    //   };
    //   validate.process(dependencies,['sale_items']).then(initialiseProcess);
    // }

    // function remove (idx) {
    //   $scope.distribution.sales.push($scope.selectedSale);
    //   $scope.selectedSale= null;
    //   $scope.selected = 'null';
    // }

    // function initialiseProcess (model) {
    //   $scope.selected = 'selected';
    //   //var items = ;
    //   var filtered;
    //   filtered = model.sale_items.data.filter(function (item) {
    //     return item.code.substring(0,1) !== '8';
    //   });
    //   filtered.forEach(function (it) {
    //     it.tracking_number = null;
    //     it.avail = (it.quantity <= it.stock) ? 'YES' : 'NO';
    //   });
    //   $scope.selectedSale.sale_items = filtered;

    //   $scope.selectedSale.sale_items.forEach(function (sale_item){
    //     connect.fetch('/lot/' +sale_item.inventory_uuid)
    //     .then(function processLots (lots){
    //       if(!lots.length){
    //         distribution.hasLot = false;
    //         messenger.danger('Pas de lot recuperes');
    //         return;
    //       }

    //       distribution.hasLot = true;

    //       if(lots.length && lots.length == 1){
    //         lots[0].setted = true;
    //         sale_item.lots = lots;
    //         return;
    //       }

    //       tapon_lot = null;
    //       for (var i = 0; i < lots.length -1; i++) {
    //         for (var j = i+1; j < lots.length; j++) {
    //           if(util.isDateAfter(lots[i].expiration_date, lots[j].expiration_date)){
    //             tapon_lot = lots[i];
    //             lots[i] = lots[j];
    //             lots[j] = tapon_lot;
    //           }
    //         }
    //       }

    //         var som = 0;
    //         lots.forEach(function (lot){
    //           som+=lot.quantity;
    //           if(sale_item.quantity > som){
    //             lot.setted = true;
    //           }else{
    //             if((som - lot.quantity) < sale_item.quantity) lot.setted = true;
    //           }
    //         });
    //         sale_item.lots = lots;
    //     });
    //   });
    // }

    // function verifySubmission (){
    //   if(!distribution.hasLot) return true
    //   if($scope.selectedSale){
    //      if($scope.selectedSale.sale_items){
    //       var availability = $scope.selectedSale.sale_items.some(function (sale_item) {
    //         return sale_item.avail == 'NO';
    //       })
    //       if(availability) return availability
    //       return false;
    //     }else{
    //       return true;
    //     }
    //   }
    // }
    // function handleError (){
    //   messenger.danger('impossible de recuperer des lots !');
    // }

    // function resolve (){
    //   return !$scope.ready;
    // }

    // function stockAvailability() {
    //   var resultat =  $scope.selectedSale.sale_items.some(function (si){
    //     var q = 0;
    //     si.lots.forEach(function (lot){
    //       if(lot.setted) q+=lot.quantity;
    //     })
    //     return (si.quantity > q)
    //   })
    //   return !resultat;
    // }

    // appstate.register('project', function (project) {
    //   $scope.project = project;
    //   validate.process(dependencies)
    //   .then(init)
    //   .catch(function (error) {
    //     console.error(error);
    //   });
    // });

    // //exposition
    // $scope.distribution = distribution;
    // $scope.initialiseDistributionDetails = initialiseDistributionDetails;
    // $scope.submit = submit;
    // $scope.add = add;
    // $scope.remove = remove;
    // $scope.resolve = resolve;
    // $scope.verifySubmission = verifySubmission;
    // $scope.stockAvailability = stockAvailability;
  }
]);
