angular.module('bhima.controllers')
.controller('SnisController', SnisController);

SnisController.$inject = ['$location', 'validate', 'SessionService'];

function SnisController($location, validate, SessionService) {
  var vm = this,
      session = vm.session = {},
      dependencies = {};

  dependencies.reports = {
    query : {
      tables : {
        'mod_snis_rapport' : { columns : ['id', 'date'] },
        'project'          : { columns : ['name'] }
      },
      join : ['mod_snis_rapport.id_snis_hopital=project.id']
    }
  };

  /** session variables */


  /** startup the module */
  startup();

  function startup() {
    vm.project = SessionService.project;
    dependencies.reports.query.where = ['project.id=' + vm.project.id];
    validate.process(dependencies, ['reports'])
    .then(init);
  }

  function init(model) {
    angular.extend(vm, model);
  }

  vm.seeForPrint = function (obj) {
    session.action = 'see_for_print';
    session.selected = obj;
  };

  vm.edit = function (obj) {
    $location.path('/snis/edit_report/' + obj.id);
  };

}
