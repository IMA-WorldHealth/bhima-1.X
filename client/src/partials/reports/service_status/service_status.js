angular.module('bhima.controllers')
.controller('ServiceStatusController', ServiceStatusController);

ServiceStatusController.$inject = [
  '$q', '$http', '$modal', 'connect', 'validate', 'messenger', 'util', 'appcache',
  'exchange', 'SessionService', 'transactionSource', '$translate', '$filter'
];

/**
  * Service Status Controller
  * This controller is responsible for report of billing by services
  */
function ServiceStatusController ($q, $http, $modal, connect, validate, messenger, util, Appcache, exchange, SessionService, transactionSource, $translate, $filter) {
  var vm = this, session = vm.session = {};

  /** initialize valriables */
  session.loading = false;
  session.dateFrom = new Date();
  session.dateTo = new Date();

  /** expose to the view */
  vm.generate = generate;
  vm.reconfigure = reconfigure;
  vm.openReceipts = openReceipts;
  vm.hideMessage = hideMessage;
  vm.print = function () { print(); };

  /** starting the module */

  /** functions definitions */
  function generate() {
    vm.state = 'generate';
    fill();
  }

  function fill() {
    vm.showMessage = true;
    session.loading = true;

    var params = {
      dateFrom : session.dateFrom,
      dateTo   : session.dateTo
    };

    $http.get('/service_status', { params : params })
    .then(function (rows) {
      vm.dataList = rows.data;
    })
    .then(totals)
    .then(renderChart)
    .catch(errorHandler);
  }

  function totals() {
    session.totalAmount = 0;
    session.totalFacture = 0;
    vm.dataList.forEach(function (item) {
      session.totalAmount += Number(item.cost);
      session.totalFacture += Number(item.nb_facture);
    });
    session.loading = false;
  }

  function reconfigure() {
    vm.state = 'default';
  }

  function hideMessage() {
    vm.showMessage = false;
  }

  function openReceipts(id) {
    vm.request = {
      id : id,
      dateFrom : util.htmlDate(vm.session.dateFrom),
      dateTo : util.htmlDate(vm.session.dateTo)
    };

    var modalInstance = $modal.open({
      backdrop: 'static',
      keyboard : false, 
      templateUrl: '/partials/reports/service_status/templates/service_billing.modal.html',
      controller: 'ServiceBillingModalController',
      resolve : {
        request : function () { return vm.request; }
      }
    });

  }

  function renderChart() {
    /* global Chart */
    var ctxCount  = document.getElementById('count-chart').getContext('2d'),
        ctxAmount = document.getElementById('amount-chart').getContext('2d');

    var chartLabels = vm.dataList.map(function (item) {
      return item.name;
    });

    var countData = vm.dataList.map(function (item) {
      return item.nb_facture;
    });

    var amountData = vm.dataList.map(function (item) {
      return item.cost;
    });

    var options = {
      responsive : false,
      maintainAspectRatio: false
    };

    var data1 = {
      labels: chartLabels,
      datasets: [
        {
            label: $filter('translate')('SERVICE.STATUS.FACT_COUNT'),
            fillColor: 'rgba(3,3,68,1)',
            strokeColor: 'rgba(3,3,68,1)',
            highlightFill: 'rgba(3,3,68,1)',
            highlightStroke: 'rgba(3,3,68,1)',
            data: countData
        }
      ]
    };

    var data2 = {
      labels: chartLabels,
      datasets: [
        {
            label: $filter('translate')('SERVICE.STATUS.FACT_AMOUNT'),
            fillColor: 'rgba(130,14,11,1)',
            strokeColor: 'rgba(130,14,11,1)',
            highlightFill: 'rgba(130,14,11,1)',
            highlightStroke: 'rgba(130,14,11,1)',
            data: amountData
        }
      ]
    };

    // Generate Chart
    var countChart  = new Chart(ctxCount).Bar(data1, options);
    var amountChart = new Chart(ctxAmount).Bar(data2, options);
  }

  function errorHandler(err) {
    console.log(err);
  }

}
