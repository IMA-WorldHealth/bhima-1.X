angular.module('bhima.services')
.service('reportConfigService', [
  function () {
    //This service essentially used the pdf report exposes an object containing common data and common function

    return {
      'configuration' : {
        language : {
          options : [
            {value : 'en', label : 'English'},
            {value : 'fr', label : 'French'}
          ]
        }
      }
    };
  }
]);
