angular.module('kpk.controllers')
.controller('utilController', function($scope, $translate, appcache, messenger) { 
  ////
  // summary: 
  //  Responsible for all utilities (buttons/ selects etc.) on the application side bar
  /////
  var MODULE_NAMESPACE = 'util';
  var cache = new appcache(MODULE_NAMESPACE); 
  
  $scope.toggleTranslate = function toggleTranslate(lang_key) { 
    messenger.push({type: 'success', msg: 'clicked translate!'}); 
    $translate.uses(lang_key);
    
    //store the current language key to be used in the next session 
    cache.put('language', {current: lang_key});
  };
});
