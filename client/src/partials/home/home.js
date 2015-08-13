angular.module('bhima.controllers')
.controller('HomeController', [
  '$scope',
  '$translate',
  'appstate',
  'exchange',
  'SessionService',
  function ($scope, $translate, appstate, exchange, SessionService) {
    var self = this;

    self.today = new Date();
    self.project = SessionService.project;
    self.user = SessionService.user;
    self.hasDailyRate = exchange.hasDailyRate();

    // FIXME
    // This doesn't account for multiple currencies
    self.exchangeRate = self.hasDailyRate ? '1 $ = ' + exchange.rate(100, 1, self.today) + ' Fc' : $translate.instant('HOME.UNDEFINED');
  }
]);
