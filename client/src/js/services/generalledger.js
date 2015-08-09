
angular.module('bhima.services')
.service('GeneralLedgerService', [
  '$http',
  '$q',
  'messenger',
  'store',
  function ($http, $q, messenger, Store) {
    'use strict';

    this.load = function () {

      var dfd = $q.defer();

      $http.get('/ledgers/general')
      .success(function (data) {

        // package data into a nice store
        var store = new Store({
          identifier : 'uuid',
          data       : data
        });

        dfd.resolve(store);
      })
      .error(function (data) {

        // TODO: messenger's error warnings should be an $httpInterceptor
        messenger.danger(data);
        dfd.reject(data);
      });

      return dfd.promise;
    };

  }
]);
