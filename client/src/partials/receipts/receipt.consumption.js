angular.module('bhima.controllers')
.controller('receipt.consumption', [
  '$scope',
  '$routeParams',
  '$q',
  '$http',
  'validate',
  'exchange',
  'appstate',
  'util',
  'connect',
  'messenger',
  function ($scope, $routeParams, $q, $http, validate, exchange, appstate, util, connect, messenger) {
    var dependencies = {}, model = $scope.model = {common : {}}; 

    dependencies.consumptions = {
      query : {
        tables : {
          'consumption' : {
            columns : ['uuid', 'date', 'tracking_number', 'quantity', 'depot_uuid']
          },
          'sale' : {
              columns : ['reference', 'cost', 'debitor_uuid', 'invoice_date']
          },          
          'stock' : {
            columns : ['inventory_uuid', 'expiration_date', 'lot_number']
          },
          'inventory' : {
            columns : ['code', 'text']
          },
          'patient' : {
            columns : ['first_name', 'last_name', 'dob', 'current_location_id']
          },
          'debitor' : {
            columns : ['group_uuid']
          },
          'debitor_group' : {
            columns : ['name', 'account_id']
          }
        },
        join : [
          'sale.uuid=consumption.document_id',
          'stock.tracking_number=consumption.tracking_number',
          'stock.inventory_uuid=inventory.uuid',
          'sale.debitor_uuid=debitor.uuid',
          'patient.debitor_uuid=sale.debitor_uuid',
          'debitor_group.uuid=debitor.group_uuid'
        ]
      }
    };

    dependencies.depot = {
      query : {
        tables : {
          'depot' : {
            columns : ['reference', 'text']
          }
        }
      }
    };    

    function getConsumptions (res) {
      model.consumptions = res.consumptions.data;      
      var reference = model.reference = model.consumptions[0];
      dependencies.depot.query.where = ['depot.uuid=' + reference.depot_uuid];
      return validate.refresh(dependencies);
    }

    function getDepot (data) {
      model.depot = data.depot.data.pop();
    }

  	appstate.register('receipts.commonData', function (commonData) {
  		commonData.then(function (values) {
        model.common.location = values.location.data.pop();
        model.common.invoiceId = values.invoiceId;
        model.common.enterprise = values.enterprise.data.pop();
        dependencies.consumptions.query.where = ['consumption.document_id=' + values.invoiceId];
        validate.process(dependencies)
        .then(getConsumptions)
        .then(getDepot)
        .catch(function (err){
          messenger.danger('error', err);
        });
  		});     
    });    
  }
]);