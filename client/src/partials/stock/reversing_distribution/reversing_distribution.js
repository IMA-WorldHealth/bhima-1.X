angular.module('bhima.controllers')
.controller('stock.reversing_distribution', [
  '$scope',
  '$routeParams',
  '$location',
  '$translate',
  'validate',
  'connect',
  'messenger',
  'uuid',
  'util',
  function ($scope, $routeParams, $location, $translate, validate, connect, messenger, uuid, util) {
    var consumptionId = $scope.consumptionId = $routeParams.consumptionId, invoiceId, dependencies = {};

    dependencies.consumption = {
      query : {
        tables : {
          'consumption' : {
            columns : ['uuid', 'depot_uuid', 'date', 'tracking_number', 'quantity']
          },
          'stock' : {
            columns : ['lot_number', 'inventory_uuid']
          },
          'inventory' : {
            columns : ['text']
          }          
        },
        join : [
          'consumption.tracking_number=stock.tracking_number',
          'stock.inventory_uuid=inventory.uuid'
        ],
        where : [
          'consumption.document_id=' + consumptionId
        ]
      }
    };

    dependencies.consumption_reversing = {
      query : {
        tables : {
          'consumption_reversing' : {
            columns : ['uuid', 'consumption_uuid']
          }          
        },
        where : [
          'consumption_reversing.document_id=' + consumptionId
        ]
      }
    };
    validate.process(dependencies, ['consumption', 'consumption_reversing'])
    .then(function (model) {
      $scope.consumption = model.consumption;
      $scope.dataReversing = model.consumption_reversing.data;
    });

    function submit(consumption) {
      if($scope.dataReversing.length >= 1){
          messenger.danger($translate.instant('STOCK.DISTRIBUTION_RECORDS.ERROR'));  
          $location.path('/stock/');              
      } else if ($scope.dataReversing.length === 0) {  
        var date = new Date(),
          description = consumption.description;
        
        var records =  consumption.data.map(function (item) {
          return {
            uuid : uuid(),
            consumption_uuid : item.uuid,
            depot_uuid : item.depot_uuid,
            document_id : consumptionId,
            date : util.sqlDate(date),
            tracking_number : item.tracking_number,
            quantity : item.quantity,
            description : description
          };
        });

        connect.post('consumption_reversing', records)
        .then(function() {
          connect.fetch('journal/reversing_stock/' + consumptionId); 
          messages();
        });       
      } else {
        messenger.danger($translate.instant('ERROR.ERR_SQL'));  
      }
    }  

    function messages() {
      messenger.success($translate.instant('STOCK.DISTRIBUTION_RECORDS.SUCCESS')); 
      $location.path('/stock/');      
    }

    $scope.submit = submit;
    $scope.messages = messages;
  }
]);
