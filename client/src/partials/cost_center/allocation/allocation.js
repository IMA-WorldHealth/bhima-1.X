angular.module('bhima.controllers')
.controller('CostCenterAllocationController', CostCenterAllocationController);

CostCenterAllocationController.$inject = [
  '$q', 'connect', 'appstate', 'validate', 'SessionService'
];

/**
  * Cost Center Allocation Controller
  * This controller is reponsible to manage Accoount deposit (versement)
  */
function CostCenterAllocationController ($q, connect, appstate,validate, SessionService) {
  var vm            = this,
      dependencies  = {},
      configuration = vm.configuration = {};

  dependencies.cost_centers = {
    query : {
      tables : {
        'cost_center' : {
          columns : ['id', 'text', 'note']
        }
      }
    }
  };

  vm.checkAllAvailable  = checkAllAvailable;
  vm.checkAllAssociated = checkAllAssociated;
  vm.performChange      = performChange;
  vm.assign             = assign;
  vm.remove             = remove;
  vm.isAssignable       = isAssignable;
  vm.isRemovable        = isRemovable;
  vm.state              = 'loading';

  startup();

  function startup() {
    vm.state = 'loading';
    vm.project = SessionService.project;
    validate.process(dependencies)
    .then(init);
  }

  function init(models) {
    angular.extend(vm, models);
    vm.acc_1 = { all : false };
    vm.acc_2 = { all : false };

    connect.req('/availableAccounts/' + vm.project.enterprise_id + '/')
    .then(function (records) {
      vm.availableAccounts = records;
      vm.state = 'loaded';
    });
  }

  function checkAllAvailable() {
    vm.availableAccounts.data.forEach(function (item) {
      item.checked = vm.acc_1.all;
    });
  }

  function checkAllAssociated() {
    vm.associatedAccounts.data.forEach(function (item) {
      item.checked = vm.acc_2.all;
    });
  }

  function performChange() {
    vm.selectedCostCenter = JSON.parse(configuration.costCenter);
    loadCenterAccount()
    .then(function (results) {
      vm.associatedAccounts = results;
    });
  }

  function assign() {
    var accounts = sanitize(); // accounts to associate
    updateAccounts(accounts)
    .then(function () {
      vm.selectedAccounts.forEach(function (item) {
        vm.availableAccounts.remove(item.id);
        item.checked = false;
        vm.associatedAccounts.post(item);
      });
    });
  }

  function remove() {
    // finds all accounts marked for removal and removes them
    var marked = filterSelectedInArray(vm.associatedAccounts.data);
    removeFromCostCenter(marked)
    .then(function () {
      marked.forEach(function (account) {
        vm.associatedAccounts.remove(account.id);
        vm.availableAccounts.post(account);
      });
    });
  }

  function filterSelectedInArray(array) {
    return array.filter(function (item) {
      return item.checked;
    });
  }

  function removeFromCostCenter(data) {
    return connect.req('/removeFromCostCenter/'+JSON.stringify(data));
  }

  function updateAccounts(accounts) {
    return $q.all(
      accounts.map(function (account) {
        return connect.basicPost('account', [account], ['id']);
      })
    );
  }

  function sanitize () {
    vm.selectedAccounts = filterSelectedInArray(vm.availableAccounts.data);
    return vm.selectedAccounts.map(function (account) {
      return { cc_id : vm.selectedCostCenter.id, id : account.id };
    });
  }

  function loadCenterAccount () {
    return connect.req('/costCenterAccount/'+ vm.project.enterprise_id + '/'+vm.selectedCostCenter.id);
  }

  function hasSelectedItems(array) {
    return array.some(function (item) {
      return item.checked;
    });
  }

  function isAssignable () {
    if (!configuration.costCenter) { return false; }
    if (!vm.availableAccounts.data.length) { return false; }
    return hasSelectedItems(vm.availableAccounts.data);
  }

  function isRemovable () {
    if (!configuration.costCenter) { return false; }
    if (!vm.associatedAccounts) { return false; }
    if (!vm.associatedAccounts.data.length) { return false; }
    return hasSelectedItems(vm.associatedAccounts.data);
  }

}
