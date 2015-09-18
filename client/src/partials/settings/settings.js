angular.module('bhima.controllers').controller('Settings', Settings);

Settings.$inject = ['$routeParams','$translate','$location','appcache','tmhDynamicLocale','connect'];

function Settings($routeParams, $translate, $location, Appcache, tmhDynamicLocale, connect) {
  var languageStore;
  var viewModel = this;
  var cache = new Appcache('preferences');

  viewModel.url = $routeParams.url || '';

  fetchAvailableLanguages();
  lookupCachedLanguage();
  
  function lookupCachedLanguage() { 
    cache.fetch('language')
    .then(function (res) {
      if (res) {
        viewModel.language = res.id;
      }
    });
  }

  function fetchAvailableLanguages() { 
    connect.req('languages')
      .then(function (store) { 

        languageStore = store;
        viewModel.languages = languageStore.data;
      });
  }
  
  function updateLanguage(key) {
    var language = languageStore.get(viewModel.language);
    
    $translate.use(language.translate_key);
    tmhDynamicLocale.set(language.locale_key);

    cache.put('language', language);
  };
  
  function back() {
    $location.url(viewModel.url);
  };
  
  viewModel.updateLanguage = updateLanguage;
  viewModel.back = back;
}
