angular.module('bhima.controllers')
.controller('stock.distribution_record', [
  '$scope',
  '$timeout',
  '$routeParams',
  'util',
  'validate',
  function ($scope, $timeout, $routeParams, util, validate) {
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
      param : {},
      searching : true
    };

    var total = $scope.total = {
      method : {
        'totalItems' : totalItems
      },
      result : {}
    };

    var depotId = $routeParams.depotId;

    dependencies.consumption = {};
    dependencies.project = {
      query : {
        tables : {
          project : {
            columns : ['id', 'abbr', 'name']
          }
        }
      }
    };

    $timeout(init, 100);

    function init() {
      validate.process(dependencies, ['project']).then(loadProjects);
    }

    function loadProjects(model) {
      $scope.model = model;
      select(period[0]);
    }

    function select(period) {
      session.selected = period;
      period.method();
    }
/*
     dataDebitor.forEach(function (item) {
 
*/
    function updateSession(model) {
      var dataConsumptionData = model.consumption.data;
      console.log('Donne de la consomation',dataConsumptionData);
      
      dataConsumptionData.forEach(function (item) {
        console.log('COnsoMATION ITEM',item);
        console.log(item.sale_uuid);

        dependencies.get_consumption = {
          query : {
            tables : {
              'consumption' : {
                columns : ['document_id'] }
            },
            where : [
              'document_id=' + item.sale_uuid
            ]
          }
        };

        dependencies.get_reversing = {
          query : {
            tables : {
              'consumption_reversing' : {
                columns : ['document_id'] }
            },
            where : [
              'document_id=' + item.sale_uuid
            ]
          }
        };

        validate.process(dependencies, ['get_consumption','get_reversing'])
        .then(function (model) {
          var nbConsumption = model.get_consumption.data.length;
          var nbReversing = model.get_reversing.data.length;
          if(nbConsumption > nbReversing){
            item.reversingUuid = null;
          }
        });        
      }); 
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
      dependencies.consumption.query = '/reports/distributionPatients/?' + JSON.stringify(request);

      total.result = {};
      if ($scope.model.consumption) {
        $scope.model.consumption.data = [];
      }
      validate.refresh(dependencies, ['consumption']).then(updateSession);
    }

    function today() {
      $scope.session.param.dateFrom = new Date();
      $scope.session.param.dateTo = new Date();
      reset();
    }

    function week() {
      $scope.session.param.dateFrom = new Date();
      $scope.session.param.dateTo = new Date();
      $scope.session.param.dateFrom.setDate($scope.session.param.dateTo.getDate() - $scope.session.param.dateTo.getDay());
      reset();
    }

    function month() {
      $scope.session.param.dateFrom = new Date();
      $scope.session.param.dateTo = new Date();
      $scope.session.param.dateFrom.setDate(1);
      reset();
    }

    function updateTotals() {
      for (var key in total.method) {
        total.result[key] = total.method[key]();
      }
    }

    function totalItems() {
      return $scope.model.consumption.data.length;
    }

    $scope.select = select;
    $scope.reset = reset;
  }
]);
