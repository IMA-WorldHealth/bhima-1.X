angular.module('bhima.services')
.service('StockDataService', StockDataService);

StockDataService.$inject = ['$http'];

function StockDataService($http) {
  var service = this;

  service.getDepots             = getDepots;
  service.getConsumption        = getConsumption;
  service.getRecentDonations    = getRecentDonations;
  service.getStockAlerts        = getStockAlerts;

  /* ------------------------------------------------------------------------ */

  // GET depots for current enterprise
  function getDepots() {
    return $http.get('/depots');
  }

  function getConsumption() {
    return $http.get('/inventory/consumption');
  }

  function getStockAlerts() {
    return $http.get('/inventory/alerts');
  }

  function getExpirations() {
    return $http.get('/inventory/expirations');
  }

  function getLeadTimes() {
    return $http.get('/inventory/leadtimes');
  }

  // TODO -- implement server-side controller for this
  function getRecentDonations(limit) {
    return $http.get('/inventory/donations?limt=' + limit);
  }
}
