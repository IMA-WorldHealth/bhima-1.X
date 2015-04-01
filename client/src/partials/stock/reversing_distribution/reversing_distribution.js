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
    var consumptionId = $scope.consumptionId = $routeParams.consumptionId, invoiceId, dependencies = {}, service_txt = 'distribution';

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

    dependencies.consumption_journal = {
      query : {
        tables : {
          'posting_journal' : {
            columns : ['uuid', 'trans_id']
          },

          'transaction_type' : {
            columns : ['id', 'service_txt']
          }          
        },
        join : [
          'posting_journal.origin_id=transaction_type.id'
        ],
        where : [
          'posting_journal.inv_po_id=' + consumptionId ,'AND','transaction_type.service_txt=' + service_txt 
        ]
      }
    };
    
    dependencies.consumption_ledger = {
      query : {
        tables : {
          'general_ledger' : {
            columns : ['uuid', 'trans_id']
          },

          'transaction_type' : {
            columns : ['id', 'service_txt']
          }          
        },
        join : [
          'general_ledger.origin_id=transaction_type.id'
        ],
        where : [
          'general_ledger.inv_po_id=' + consumptionId ,'AND','transaction_type.service_txt=' + service_txt 
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
    validate.process(dependencies, ['consumption', 'consumption_reversing', 'consumption_journal', 'consumption_ledger'])
    .then(function (model) {
      var journal_ledger =  [];   
      $scope.nbConsumption = model.consumption.data.length;
      $scope.nbReversing = model.consumption_reversing.data.length;
      var data_consumptions = [];
      if(model.consumption_reversing.data){
        model.consumption.data.forEach(function (item) {
          var is_reversing = 0;
          model.consumption_reversing.data.forEach(function (revers) {
            if(item.uuid === revers.consumption_uuid){
              is_reversing = 1;
            }
          });
          if(is_reversing === 0){
            data_consumptions.push(item);  
          }
        });
      } else {
        data_consumptions = model.consumption.data;
      }
      model.consumption.data = data_consumptions;

      $scope.consumption = model.consumption;
      $scope.dataReversing = model.consumption_reversing.data;
      var journalData = model.consumption_journal.data, 
        ledgerData = model.consumption_ledger.data,
        trans_id = '';

      if(journalData.length && ledgerData.length){
        journal_ledger = journalData.concat(ledgerData);
      } else if(journalData.length && !ledgerData.length){
        journal_ledger = journalData;
      } else if(!journalData.length && ledgerData.length){
        journal_ledger = ledgerData;
      }  
      
      journal_ledger.forEach(function (item) {
        if(trans_id < item.trans_id){
          trans_id = item.trans_id;
        }
      });

      $scope.trans_id = trans_id;
    });

    function submit(consumption) {
      if($scope.nbConsumption === $scope.nbReversing){
          messenger.danger($translate.instant('STOCK.DISTRIBUTION_RECORDS.ERROR'));  
          $location.path('/stock/');              
      } else if ($scope.nbConsumption > $scope.nbReversing) {  
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
          connect.fetch('journal/reversing_stock/' + $scope.trans_id); 
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
