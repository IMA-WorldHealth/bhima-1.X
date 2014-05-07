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
    var distribution = {}, dependencies = {};
    distribution.visible = true;
    distribution.noEmpty = false;
    distribution.item_records = [];
    distribution.moving_records = [];
    distribution.rows = [];
    distribution.sales = [];


    dependencies.stocks = {
      required : true,
      query : {
        tables : {
          'stock' : {
            columns : ['inventory_uuid', 'purchase_price', 'expiration_date', 'entry_date', 'lot_number', 'purchase_order_uuid', 'tracking_number', 'quantity']
          },
          'inventory' : {
            columns : ['uuid', 'text', 'enterprise_id', 'code', 'inventory_code', 'price', 'stock']
          }
        },
          join : ['stock.inventory_uuid=inventory.uuid']
      }
    };

    dependencies.project = {
      required : true,
      query : {
        tables : {
          'project' : {
            columns : ['abbr', 'name']
          }
        }
      }
    };

    dependencies.debitor_group = {
      required : true,
      query : {
        tables : {
          'debitor_group' : {
            columns : ['is_convention', 'name', 'uuid', 'account_id']
          }
        }
      }
    };

    function initialiseDistributionDetails (selectedDebitor){
      if(!selectedDebitor) return;

      distribution.noEmpty = true;
      $scope.ready = "ready";
      distribution.selectedDebitor = selectedDebitor;
      connect.fetch('/ledgers/debitor/' + selectedDebitor.debitor_uuid)
      .success(function (data) {
        data.map(function (row) {
          row.reference = getAbbr(row.project_id)+row.reference;
          row.etat = getState(row);
        });
        distribution.sales = data;
        // $scope.ledger = data.filter(function (row) {
        //   return row.balance > 0;
        // });
      })
      .error(function (err) {
        messenger.danger('An error occured:' + JSON.stringify(err));
      });
      window.distribution = distribution;
    }

    function getAbbr(project_id){
      return $scope.model.project.data.filter(function (item){
        return item.id = project_id;
      })[0].abbr;
    }

    function getState (sale){
      return ($scope.model.debitor_group.data.filter(function (item) {
        return item.account_id == sale.account_id;
      })[0].is_convention == 1)? "CONVENTION" : (sale.balance>0)? "NON PAYE" : "PAYE";
    }

    function init (model){
      //init model
      $scope.model = model;
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

    function sanitize (){
      distribution.rows = $scope.selectedSale.sale_items;
      distribution.item_records = distribution.rows.map(function (it){
        return {
          document_id : uuid(),
          tracking_number : it.tracking_number,
          date : util.convertToMysqlDate(new Date().toString()),
          depot_id : 1,
          amount : it.quantity,
          patient_uuid : $scope.distribution.selectedDebitor.uuid
        };
      });

      distribution.moving_records = distribution.rows.map(function (it){
        return {
          document_id : uuid(),
          tracking_number : it.tracking_number,
          direction : 'Exit',
          date : util.convertToMysqlDate(new Date().toString()),
          quantity : it.quantity,
          depot_id : 1, //for now
          destination : 1 //for patient
        };
      });

    }

    function submit (){
      sanitize();
      doMovingStock()
      //.then(updateStock)
      .then(function(result){
        console.log('[result ...]')
      });
    }

    function updateStock (){
      validate.refresh(dependencies, ['stock'])
      .then(function (model){
        console.log('motre model',model)
      })


    }

    function doMovingStock (){
      return $q.all(
        connect.basicPut('consumption', distribution.item_records),
         connect.basicPut('stock_movement', distribution.moving_records)
      );
    }

    function handleSaleResponse(result) {
      //recoverCache.remove('session');
      //$location.path('/invoice/sale/' + result.data.saleId);
    }

    function add (idx) {
      if($scope.selectedSale) return;
      $scope.selectedSale =  $scope.distribution.sales.splice(idx, 1)[0];
      dependencies.sale_items = {
        required : true,
        query : {
          tables : {
            'sale_item' : {columns : ['uuid', 'inventory_uuid', 'quantity']},
            'inventory' : {columns : ['code', 'text', 'stock']}
          },
          join  : ['sale_item.inventory_uuid=inventory.uuid'],
          where : ['sale_item.sale_uuid='+$scope.selectedSale.inv_po_id]
        }
      };

      validate.process(dependencies,['sale_items']).then(initialiseProcess);
    }

    function remove (idx) {
      $scope.distribution.sales.push($scope.selectedSale);
      $scope.selectedSale= null;
      $scope.selected = "null";
    };

    function initialiseProcess (model) {
      $scope.selected = "selected";
      var items = model.sale_items.data;
      var filtered;
      filtered = items.filter(function (item) {
        return item.code.substring(0,1) !== "8";
      });
      filtered.forEach(function (it) {
        it.tracking_number = null;
        it.avail = (it.quantity <= it.stock) ? "YES" : "NO";
      });
      $scope.selectedSale.sale_items = filtered;

      $scope.selectedSale.sale_items.forEach(function (sale_item){
        connect.fetch('/lot/' +sale_item.inventory_uuid)
        .success(function processLots (lots){
          if(!lots.length){
            messenger.danger('Pas de lot recuperes');
            return;
          }

          if(lots.length && lots.length == 1){
            lots[0].setted = true;
            sale_item.lots = lots;
            return;
          }

          tapon_lot = null;
          for (var i = 0; i < lots.length -1; i++) {
            for (var j = i+1; j < lots.length; j++) {
              if(util.isDateAfter(lots[i].expiration_date, lots[j].expiration_date)){
                tapon_lot = lots[i];
                lots[i] = lots[j];
                lots[j] = tapon_lot;
              }
            }
          }

          $scope.selectedSale.sale_items.forEach(function (sale_item){
            var som = 0;
            lots.forEach(function (lot){
              som+=lot.quantity;
              if(sale_item.quantity > som){
                lot.setted = true;
              }else{
                if((som - lot.quantity) < sale_item.quantity) lot.setted = true;
              }
            })
          })

          console.log(lots);
           //  lots[0].setted = true;
          // for(var j=1; j<=lots.length-1; j++){
          //   if(util.isDateAfter(lots[0].expiration_date, lots[j].expiration_date)){
          //     tapon_lot = lots[0];
          //     lots[0] = lots[j];
          //     lots[0].setted =true;
          //     lots[j] = tapon_lot;
          //     lots[j].setted = false;
          //   }else{
          //     lots[j].setted = false;
          //   }
          // }

          return;
          // sale_item.lots = lots;
          // sale_item.tracking_number = lots[0].tracking_number;
          // console.log('[lots]', sale_item.lots);
        })
        .error(handleError);
      });
    }

    function verifySubmission (){

    }

    function handleError (){
      messenger.danger('impossible de recuperer des lots !');
    }

    function resolve (){
      return !$scope.ready;
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
    $scope.submit = submit;
    $scope.add = add;
    $scope.remove = remove;
    $scope.resolve = resolve;
    $scope.verifySubmission = verifySubmission;
  }
]);
