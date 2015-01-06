angular.module('bhima.controllers')
.controller('stock.reversing_service_distribution', [
  '$scope',
  '$routeParams',
  '$location',
  '$translate',
  'validate',
  'connect',
  'messenger',
  'uuid',
  'appstate',
  'util',
  function ($scope, $routeParams, $location, $translate, validate, connect, messenger, uuid, appstate, util) {
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
          'consumption.uuid=' + consumptionId
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
          'consumption_reversing.consumption_uuid=' + consumptionId
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
          description = consumption.description,
          item = consumption.data[0];
        
        item.consumption_uuid = item.uuid;      
        item.inventory_uuid = null;
        item.lot_number = null; 
        item.text = null;

        item.uuid = uuid();
        item.date = util.sqlDate(date);   
        item.description = description;
        item.document_id = consumptionId;    

        connect.post('consumption_reversing', [connect.clean(item)])
        .then(function () {
          messenger.success($translate.instant('STOCK.DISTRIBUTION_RECORDS.SUCCESS'));   
          $location.path('/stock/');       
        });          
      } else {
        messenger.danger($translate.instant('ERROR.ERR_SQL'));  
      }                    
    }  

    $scope.submit = submit;
  }
]);
