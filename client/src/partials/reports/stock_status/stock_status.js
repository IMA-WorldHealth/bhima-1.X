angular.module('bhima.controllers')
.controller('StockStatusReportController', StockStatusReportController);

StockStatusReportController.$inject = ['$http', '$timeout'];

/**
* Stock Status Report
*
* This controller gives a broad overview of stock levels, expiration times,
* lead times, and more for all depots.
*
* NOTES
*  1) I have removed "quantity to order", as I think this should really be a
*     parameter provided by an alert.  Currently, our calculates are really poor
*     due to poor data.
*/
function StockStatusReportController($http, $timeout) {
  var vm = this,
      endpoints;

  vm.loading = true;
  vm.timestamp = new Date();
  vm.report = {};

  /* ------------------------------------------------------------------------ */

  // start up the module
  $http.get('/inventory/status')
  .then(template)
  .catch(handler)
  .finally(function () {

    // use $timeout trick to delay rendering until all other rendering is done
    $timeout(endLoading);
  });

  function endLoading() {
    vm.loading = false;
  }

  // template the data into the view
  function template(response) {
    var report;

    // filter out items that are missing both a quantity and a lead time.  This
    // should ensure that we have only relevant data.
    report = response.data.filter(function (row) {
      return (row.quantity > 0 || row.leadtime !== null);
    });

    // calculate the security/safety stock if applicable
    // NOTE -- this goes by the "old" formula.  What do we do with this in the
    // case of stock integration?  What about donations?
    report.forEach(function (row) {

      // security stock is defined as leadtime multiplied by avg consumption
      // rate
      row.securityStock = row.leadtime !== null ?
          row.leadtime * row.consumption:
          null;
      
      // make sure we have nice formatting for days remaining column.
      row.remaining = Math.floor(row.remaining);

      // if there is an alert, we template it in
      row.alert = row.stockout ? 'STOCK.ALERTS.STOCKOUT' :
                  row.shortage ? 'STOCK.ALERTS.SHORTAGE' :
                  row.overstock ? 'STOCK.ALERTS.OVERSTOCK' :
                  false;
    });


    vm.report = report;
  }

  // generic error handler
  function handler(error) {
    console.log(error);
  }

}
