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
  function ($scope, $translate, validate, connect, messenger, appstate, util, uuid) {
    var distribution = {}, dependencies = {};
    distribution.visible = false;
    distribution.noEmpty = false;

    dependencies.stocks = {
      required : true,
      query : {
        tables : {
          'stock' : {
            columns : ['inventory_uuid', 'purchase_price', 'expiration_date', 'entry_date', 'lot_number', 'purchase_order_uuid', 'tracking_number', 'quantity']
          },
          'inventory' : {
            columns : ['uuid', 'text']
          }
        },
          join : ['stock.inventory_uuid=inventory.uuid']
      }
    };

    function initialiseDistributionDetails (selectedDebitor){
      if(selectedDebitor) distribution.noEmpty = true;
      distribution.selectedDebitor = selectedDebitor;
      window.selectedDebitor = selectedDebitor;
      distribution.rows = [];
    }

    function init (model){
      $scope.model = model;
      console.log('model', model);
    }

    function addRow () {
      distribution.rows.push(new DistributionItem());
    }

    function DistributionItem () {
      this.movement = {};
      this.item = {};

      this.item.document_id = uuid();
      this.item.tracking_number = null;
      this.item.date = util.convertToMysqlDate(new Date().toString());
      this.item.depot_id = null;
      this.item.amount = null;
      this.item.text = null;
      this.item.patient_uuid = $scope.distribution.selectedDebitor.uuid;
      this.item.movement = new movement(this);
      return this;
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

    function submitInvoice (){

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
    $scope.submitInvoice = submitInvoice;
    $scope.verifySubmission = verifySubmission;
  }
]);
