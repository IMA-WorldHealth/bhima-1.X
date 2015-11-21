angular.module('bhima.controllers')
.controller('CashboxController', CashboxController);

CashboxController.$inject = [ 'SessionService', 'ProjectService', 'CashboxService', '$window'];

/**
* Cashbox Controller
*
* This controller is responsible for creating new cashboxes for the enterprise
*/
function CashboxController(Session, Projects, Boxes, $window) {
  var vm = this;

  // bind variables
  vm.enterprise = Session.enterprise;
  vm.project = Session.project;

  // bind methods
  vm.create = create;
  vm.update = update;
  vm.cancel = cancel;
  vm.submit = submit;
  vm.delete = del;

  /* ------------------------------------------------------------------------ */

  function handler(error) {
    vm.message = error.data;
    vm.message.type = 'danger';
    console.error(error.data.reason);
  }
  
  // state transitions
  function setState(state) {
    vm.box = {};
    vm.state = state;
    vm.message = null;
  }

  function startup() {

    // load projects
    Projects.read().then(function (data) {
      vm.projects = data;
    }).catch(handler);

    // load cashboxes
    Boxes.read().then(function (data) {
      vm.cashboxes = data;
    }).catch(handler);

    // default state
    setState('default');
  }

  function cancel() {
    setState('default');
  }

  function create() {
    setState('create');
  }

  function update(id) {

    // load the cashbox
    Boxes.read(id).then(function (data) {
      setState('update');
      vm.box = data;
    })
    .catch(handler);
  }

  function submit(invalid) {
    if (invalid) { return; }

    var promise = (vm.state === 'create') ?
      Boxes.create(vm.box) :
      Boxes.update(vm.id, vm.box);

    promise.then(function (message) {
      setState('success');
      vm.message = message;
    })
    .catch(handler);
  }
  
  function del(box) {
    var yes =
      $window.confirm('Are you sure you want to delete this cashbox?');

    if (yes) {
      Boxes.delete(box.id).then(function (message) {
        setState('success');
        vm.message = {
          type : 'success',
          code : 'CASHBOXES.DELETE_SUCCESS'
        };
      })
      .catch(handler);
    }
  }

  startup();
}
