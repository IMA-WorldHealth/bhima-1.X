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
            columns : ['uuid', 'text', 'enterprise_id', 'code', 'inventory_code', 'price']
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
      .then(function(result){
      });
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

    function initialiseProcess (model){
      $scope.selected = "selected";
      $scope.selectedSale.sale_items = model.sale_items.data.filter(function (item){
        console.log('[item.code.substring(0,1)]', item.code.substring(0,1));
        return item.code.substring(0,1) !== "8";
      }).map(function (it) {
        it.avail = (it.stock < it.quantity)? "NO" : "YES";
        return it;
      });

      console.log('[selected sale items]', $scope.selectedSale);
    }

    function verifySubmission (){

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
