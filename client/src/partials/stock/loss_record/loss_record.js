angular.module('bhima.controllers')
.controller('stock.loss_record', [
  '$scope',
  '$timeout',
  '$routeParams',
  'util',
  'validate',
  'exchange',
  function ($scope, $timeout, $routeParams, util, validate, exchange) {
    // TODO add search (filter)
    // TODO add sortable (clickable) columns
    var dependencies = {};

    var period = $scope.period = [
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

    var session = $scope.session = {
      param     : {},
      searching : true
    };

    var total = $scope.total = {};

    var depotId = $routeParams.depotId;

    dependencies.loss = {
      query : {
        identifier : 'uuid',
          tables : {
            consumption : { columns : ['quantity', 'date', 'uuid'] },
            consumption_loss : { columns : ['document_uuid'] },
            stock : {columns : ['tracking_number', 'lot_number', 'entry_date']},
            inventory : {columns : ['text', 'purchase_price']}
          },
          join : ['consumption.uuid=consumption_loss.consumption_uuid', 'consumption.tracking_number=stock.tracking_number', 'stock.inventory_uuid=inventory.uuid']
      }
    };

    init();

    function init() {
      validate.process(dependencies).then(loadProjects);
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
      updateTotals();
      session.searching = false;
    }

    function reset() {
      var request;

      request = {
        dateFrom : util.sqlDate(session.param.dateFrom),
        dateTo : util.sqlDate(session.param.dateTo),
        depotId : depotId
      };

      if (!isNaN(Number(session.project))) {
        request.project = session.project;
      }

      session.searching = true;
      dependencies.loss.query = {
        identifier : 'uuid',
          tables : {
            consumption : { columns : ['quantity', 'date', 'uuid'] },
            consumption_loss : { columns : ['document_uuid'] },
            stock : {columns : ['tracking_number', 'lot_number', 'entry_date']},
            inventory : {columns : ['text', 'purchase_price']}
          },
          join : ['consumption.uuid=consumption_loss.consumption_uuid', 'consumption.tracking_number=stock.tracking_number', 'stock.inventory_uuid=inventory.uuid'],
          where: ['stock.entry_date>=' + request.dateFrom,'AND','stock.entry_date<=' + request.dateTo]
      };

      total.result = {};
      if ($scope.model.loss) {
        $scope.model.loss.data = [];
      }
      validate.refresh(dependencies, ['loss']).then(updateSession);
    }

    function today() {
      session.param.dateFrom = new Date();
      session.param.dateTo = new Date();
      reset();
    }

    function week() {
      session.param.dateFrom = new Date();
      session.param.dateTo = new Date();
      session.param.dateFrom.setDate(session.param.dateTo.getDate() - session.param.dateTo.getDay());
      reset();
    }

    function month() {
      session.param.dateFrom = new Date();
      session.param.dateTo = new Date();
      session.param.dateFrom.setDate(1);
      reset();
    }

    function updateTotals() {
      total.loss = totalLoss();
      total.loss_amount = $scope.model.loss.data.reduce(sum,0);
    }

    function sum(a, b) {
    	return a + (b.purchase_price * b.quantity);
    }

    function totalLoss() {
      return $scope.model.loss.data.length;
    }

    $scope.select = select;
    $scope.reset = reset;
  }
]);
