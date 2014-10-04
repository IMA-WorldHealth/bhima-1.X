angular.module('bhima.controllers')
.controller('settings', [
  '$scope',
  '$routeParams',
  '$translate',
  '$location',
  'appcache',
  'messenger',
  function($scope, $routeParams, $translate, $location, Appcache, messenger) {

    $scope.url = $routeParams.url || '';
    var cache = new Appcache('preferences');

    cache.fetch('language')
    .then(function (res) {
      if (res) {
        $scope.settings = {language: res.current};
      }
    });

    $scope.updateLanguage = function updateLanuage(key) {
      $translate.use(key);
      cache.put('language', {current: key});

      messenger.primary({ namespace : 'SETTINGS', description : 'Language preference updated : ' + key });
    };

    $scope.back = function () {
      $location.url($scope.url);
    };
  }
]);
