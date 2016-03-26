angular.module('bhima.controllers')
.controller('CustomerDebtController',  CustomerDebtController);

CustomerDebtController.$inject = [
  '$q', '$http', '$location', 'validate', 'util',
  'exchange', 'SessionService'
];

function CustomerDebtController ($q, $http, $location, validate, util, exchange, SessionService) {
  var vm = this,
      session = vm.session = {},
      dependencies = {};

  dependencies.debtorGroups = {
    required: true,
    query : {
      tables : {
        'debitor_group' : { columns : ['uuid', 'name', 'account_id', 'locked', 'is_convention'] }
      }
    }
  };

  /** variables definitions */

  /** expose to the view */

  vm.setSelectedGroup = setSelectedGroup;
  vm.reconfigure = reconfigure;
  vm.print = imprimer;
  vm.goto  = goto;

  /** startup the module */

  startup();

  /** functions definitions */

  function startup() {
    validate.process(dependencies)
    .then(initialize);
  }

  function initialize(models) {
    angular.extend(vm, models);
    getPeriodicDebts();
  }

  function getPeriodicDebts() {
    vm.loading = true;
    var uuid = vm.selectedGroup ? vm.selectedGroup.uuid : '*';
    $http.get('/customer_debt/', { params : { uuid : uuid } })
    .then(getDebtorList)
    .then(totals)
    .catch(error);
  }

  function getDebtorList(rows) {
    vm.loading = false;
    vm.customerDebts = {
      first  : rows.data.first,
      second : rows.data.second,
      third  : rows.data.third,
      fourth : rows.data.fourth
    };

    session.debtorList = [];
    var temporary = [];

    /** first : less than 3 months */
    vm.customerDebts.first.forEach(function (item) {
      var line = {
        uuid : item.debitor_uuid,
        group_uuid : item.group_uuid,
        text : item.text,
        balance_first  : item.balance,
        balance_second : 0,
        balance_third  : 0,
        balance_fourth : 0,
      };
      temporary.push(line);
    });

    /** second: between 3 and 6 months */
    vm.customerDebts.second.forEach(function (item) {
      var line = {
        uuid : item.debitor_uuid,
        group_uuid : item.group_uuid,
        text : item.text,
        balance_first  : 0,
        balance_second : item.balance,
        balance_third  : 0,
        balance_fourth : 0
      };
      temporary.push(line);
    });

    /** third: between 6 and 12 months */
    vm.customerDebts.third.forEach(function (item) {
      var line = {
        uuid : item.debitor_uuid,
        group_uuid : item.group_uuid,
        text : item.text,
        balance_first  : 0,
        balance_second : 0,
        balance_third  : item.balance,
        balance_fourth : 0
      };
      temporary.push(line);
    });

    /** third: between 6 and 12 months */
    vm.customerDebts.fourth.forEach(function (item) {
      var line = {
        uuid : item.debitor_uuid,
        group_uuid : item.group_uuid,
        text : item.text,
        balance_first  : 0,
        balance_second : 0,
        balance_third  : 0,
        balance_fourth : item.balance
      };
      temporary.push(line);
    });

    var unique = {}, uniqueTmp = {};
    temporary.forEach(function (item) {
      if (!unique[item.uuid]) {
        unique[item.uuid] = true;
        uniqueTmp[item.uuid] = item;
      } else {
        uniqueTmp[item.uuid].balance_first  += item.balance_first;
        uniqueTmp[item.uuid].balance_second += item.balance_second;
        uniqueTmp[item.uuid].balance_third  += item.balance_third;
        uniqueTmp[item.uuid].balance_first  += item.balance_first;
      }
    });

    session.debtorList = temporary;

  }

  function totals() {
    session.totalFirst  = 0;
    session.totalSecond = 0;
    session.totalThird  = 0;
    session.totalFourth = 0;
    session.debtorList.forEach(function (item) {
      session.totalFirst  += item.balance_first;
      session.totalSecond += item.balance_second;
      session.totalThird  += item.balance_third;
      session.totalFourth += item.balance_fourth;
    });
    session.totalTotal  = session.totalFirst + session.totalSecond + session.totalThird + session.totalFourth;
  }

  function sumAttribute(array, attribute) {
    return array.length ? array.reduce(function (a, b) { return b[attribute] + a; }) : 0;
  }

  function setSelectedGroup() {
    vm.state = 'generate';
    getPeriodicDebts();
  }

  function goto(document_uuid) {
    $location.path('/invoice/sale/' + document_uuid);
  }

  function reconfigure() {
    vm.state = '';
  }

  function imprimer() {
    print();
  }

  function error(err) {
    console.log(err);
  }
}
