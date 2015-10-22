angular.module('bhima.services')
.service('reportConfigService', ReportConfigService);

ReportConfigService.$inject = ['SessionService'];

/**
* This service essentially used the pdf report exposes an object containing common data and common function
*
* @todo Make this service much more useful with getter/setter methods for lang,
* layout, and more.  Not sure if this really needs SessionService.
*/
function ReportConfigService(sessionService) {
  var service = this;

  service.configuration = {
      language : {
        options : [
          {value : 'en', label : 'English'},
          {value : 'fr', label : 'French'}
        ]
      },
      enterprise : sessionService.enterprise,
      project : sessionService.project
  };

  return service;
}
