angular.module('kpk.controllers').controller('settingsController', function($scope, connect, $translate, appcache, messenger) { 
  console.log('settings controller initialised');

  var MODULE_NAMESPACE = 'util';
  var cache = new appcache(MODULE_NAMESPACE);

  cache.fetch('language')
  .then(function(res) { 
    if(res) $scope.settings = {language: res.current};
  });

  $scope.updateLanguage = function updateLanuage(key) { 
    $translate.uses(key);
    cache.put('language', {current: key});
    messenger.push({type: 'success', msg: 'Language preference updated: ' + key});
  };
});
