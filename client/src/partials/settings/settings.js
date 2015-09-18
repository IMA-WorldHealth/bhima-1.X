angular.module('bhima.controllers')
.controller('settings', [
  '$scope',
  '$routeParams',
  '$translate',
  '$location',
  'appcache',
  'messenger',
  'tmhDynamicLocale',
  'connect',
  function($scope, $routeParams, $translate, $location, Appcache, messenger, tmhDynamicLocale, connect) {
    
    var languageStore;

    $scope.url = $routeParams.url || '';
    var cache = new Appcache('preferences');

    fetchAvailableLanguages();
    
    cache.fetch('language')
    .then(function (res) {
      if (res) {
        $scope.settings = { language: res.id };
      }
    });

    function fetchAvailableLanguages() { 
      connect.req('languages')
        .then(function (store) { 

          languageStore = store;
          $scope.languages = languageStore.data;
        });
    }

    $scope.updateLanguage = function updateLanuage(key) {
      var language = languageStore.get(key);
      
      $translate.use(language.translate_key);
      tmhDynamicLocale.set(language.locale_key);

      cache.put('language', language);
    };

    $scope.back = function () {
      $location.url($scope.url);
    };
  }
]);
