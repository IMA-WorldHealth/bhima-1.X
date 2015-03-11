angular.module('bhima.controllers')
.controller('donation_record', [
  '$scope',
  '$timeout',
  '$routeParams',
  '$translate',
  'appstate',
  'util',
  'validate',
  'exchange',
  function ($scope, $timeout, $routeParams, $translate, appstate, util, validate, exchange) {
    
    var dependencies = {},
        state = $scope.state,
        session = $scope.session = { param : {}, searching : true };

    dependencies.depots = {
      required: true,
      query : {
        tables : {
          'depot' : {
            columns : ['uuid', 'text', 'reference', 'enterprise_id']
          }
        }
      }
    };
    validate.process(dependencies, ['depots']);       

    var period = $scope.period = [
      {
        key : 'UTIL.ALL',
        method : all
      },
      {
        key : 'CASH_PAYMENTS.DAY',
        method : today
      },
      {
        key : 'CASH_PAYMENTS.WEEK',
        method : week
      },
      {
        key : 'CASH_PAYMENTS.MONTH',
        method : month
      }
    ];

    

    var total = $scope.total = {};

    dependencies.loss = {
      query : {
        identifier : 'uuid',
          tables : {
            consumption : { columns : ['quantity', 'date', 'uuid'] },
            consumption_loss : { columns : ['document_uuid'] },
            stock : {columns : ['tracking_number', 'lot_number', 'entry_date']},
            inventory : {columns : ['text', 'purchase_price']},
            purchase : { columns : ['purchase_date']},
            purchase_item : { columns : ['unit_price']}
          },
          join : [
            'consumption.uuid=consumption_loss.consumption_uuid', 
            'consumption.tracking_number=stock.tracking_number', 
            'stock.inventory_uuid=inventory.uuid',
            'stock.purchase_order_uuid=purchase.uuid', 
            'purchase.uuid=purchase_item.purchase_uuid',
            'purchase_item.inventory_uuid=inventory.uuid'
          ]
      }
    };

    init();

    function init() {
      validate.process(dependencies).then(loadProjects);
      session.depot = '*';
    }

    function loadProjects(model) {
      $scope.model = model;
      select(period[0]);
    }

    function select(period) {
      session.selected = period;
      period.method();
    }

    function updateSession(model) {
      $scope.model = model;
      groupingLoss(model.loss.data);
      updateTotals();
      session.searching = false;
    }

    function reset() {
      $scope.state = 'generate';
      var request;
      console.log('Origin',session.depot);
      request = {
        dateFrom : util.sqlDate(session.param.dateFrom),
        dateTo : util.sqlDate(session.param.dateTo),
        depotId : session.depot
      };

      if (!isNaN(Number(session.project))) {
        request.project = session.project;
      }

      session.searching = true;

      dependencies.loss = {
	      query : {
	        identifier : 'uuid',
	          tables : {
	            consumption : { columns : ['quantity', 'date', 'uuid'] },
	            consumption_loss : { columns : ['document_uuid'] },
	            stock : {columns : ['tracking_number', 'lot_number', 'entry_date']},
	            inventory : {columns : ['text', 'purchase_price']},
	            purchase : { columns : ['purchase_date']},
	            purchase_item : { columns : ['unit_price']}
	          },
	          join : [
	            'consumption.uuid=consumption_loss.consumption_uuid', 
	            'consumption.tracking_number=stock.tracking_number', 
	            'stock.inventory_uuid=inventory.uuid',
	            'stock.purchase_order_uuid=purchase.uuid', 
	            'purchase.uuid=purchase_item.purchase_uuid',
	            'purchase_item.inventory_uuid=inventory.uuid'
	          ]
	      }
	    };

      if(request.depotId === '*'){
        $scope.depotSelected = $translate.instant('EXPIRING_REPORT.ALL_DEPOTS');
        dependencies.loss.query.where = ['consumption.date>=' + request.dateFrom,'AND','consumption.date<=' + request.dateTo];  
      } else {
        dependencies.store = {
          required: true,
          query : {
            tables : {
              'depot' : {
                columns : ['uuid', 'text', 'reference', 'enterprise_id']
              }
            },
            where : ['depot.uuid=' + session.depot]
          }
        };
        validate.process(dependencies, ['store'])
        .then(function (model) {
          var dataDepot = model.store.data[0];
          $scope.depotSelected = dataDepot.text;
        });       


        dependencies.loss.query.where = ['consumption.depot_uuid=' + request.depotId,'AND','consumption.date>=' + request.dateFrom,'AND','consumption.date<=' + request.dateTo]; 
      }

      total.result = {};
      if ($scope.model.loss) {
        $scope.model.loss.data = [];
        session.loss = [];
      }
      validate.refresh(dependencies, ['loss']).then(updateSession);
    }

    function today() {
      session.param.dateFrom = new Date();
      session.param.dateTo = new Date();
    }

    function week() {
      session.param.dateFrom = new Date();
      session.param.dateTo = new Date();
      session.param.dateFrom.setDate(session.param.dateTo.getDate() - session.param.dateTo.getDay());
    }

    function month() {
      session.param.dateFrom = new Date();
      session.param.dateTo = new Date();
      session.param.dateFrom.setDate(1);
    }

    function updateTotals() {
      total.loss = totalLoss();
      total.loss_amount = $scope.model.loss.data.reduce(sum,0);
    }

    function sum(a, b) {
    	return a + (b.unit_price * b.quantity);
    }

    $scope.print = function print() {
      window.print();
    };

    function reconfigure () {
      $scope.state = null;
      $scope.session.depot = '*';
      $scope.depotSelected = null;
    }    

    appstate.register('enterprise', function(enterprise) {
      $scope.enterprise = enterprise;
    });

    $scope.select = select;
    $scope.reset = reset;
    $scope.reconfigure = reconfigure;
  }
]);
