angular.module('bhima.controllers')
.controller('settingsController', [
  '$scope',
  '$routeParams',
  '$translate',
  '$location',
  'connect',
  'appcache',
  'messenger',
  function($scope, $routeParams, $translate, $location, connect, appcache, messenger) {

    $scope.q = $routeParams.q || '';

    var MODULE_NAMESPACE = 'util';
    var cache = new appcache(MODULE_NAMESPACE);

    cache.fetch('language')
    .then(function(res) {
      if(res) $scope.settings = {language: res.current};
    });

    $scope.updateLanguage = function updateLanuage(key) {
      $translate.use(key);
      cache.put('language', {current: key});
      messenger.push({type: 'success', msg: 'Language preference updated: ' + key});
    };

    $scope.back = function () {
      $location.path($scope.q).search('q', '');
    };

  }
]);
