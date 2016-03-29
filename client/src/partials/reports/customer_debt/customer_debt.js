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

  /** variables definitions */
  vm.untilDate   = new Date();

  /** expose to the view */
  vm.generate    = generate;
  vm.reconfigure = reconfigure;
  vm.print       = imprimer;

  /** functions definitions */
  function startup() {
    validate.process(dependencies)
    .then(initialize);
  }

  function initialize(models) {
    angular.extend(vm, models);
  }

  function generate()  {
    vm.state = 'generate';
    getPeriodicDebts()
    .then(getDebtorGroupList)
    .then(totals)
    .catch(error);  
  }
  

  function getPeriodicDebts() {
    vm.loading = true;

    var params = {
      date : vm.withUntilDate ? util.htmlDate(vm.untilDate) : ''
    };

    return $http.get('/customer_debt/', { 
      params : params 
    });
  }

  /** debtor group data */
  function getDebtorGroupList(rows) {
    var innerCustomerDebts = {
      first  : rows.data.first,
      second : rows.data.second,
      third  : rows.data.third,
      fourth : rows.data.fourth
    };

    session.debtorList = [];
    var temporary = [];

    /** first : less than 3 months */
    innerCustomerDebts.first.forEach(function (item) {
      var line = {
        uuid           : item.uuid,
        group_uuid     : item.uuid,
        text           : item.name,
        balance_first  : item.balance,
        balance_second : 0,
        balance_third  : 0,
        balance_fourth : 0,
      };
      temporary.push(line);
    });

    /** second: between 3 and 6 months */
    innerCustomerDebts.second.forEach(function (item) {
      var line = {
        uuid           : item.uuid,
        group_uuid     : item.uuid,
        text           : item.name,
        balance_first  : 0,
        balance_second : item.balance,
        balance_third  : 0,
        balance_fourth : 0,
      };
      temporary.push(line);
    });

    /** third: between 6 and 12 months */
    innerCustomerDebts.third.forEach(function (item) {
      var line = {
        uuid           : item.uuid,
        group_uuid     : item.uuid,
        text           : item.name,
        balance_first  : 0,
        balance_second : 0,
        balance_third  : item.balance,
        balance_fourth : 0,
      };
      temporary.push(line);
    });

    /** third: between 6 and 12 months */
    innerCustomerDebts.fourth.forEach(function (item) {
      var line = {
        uuid           : item.uuid,
        group_uuid     : item.uuid,
        text           : item.name,
        balance_first  : 0,
        balance_second : 0,
        balance_third  : 0,
        balance_fourth : item.balance,
      };
      temporary.push(line);
    });

    var unique = {}, uniqueTmp = {}, count = 0;
    temporary.forEach(function (item, index) {
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

    session.debtorList = [];
    Object.keys(uniqueTmp).forEach(function (key) {
      session.debtorList.push(uniqueTmp[key]);
    });
    
    vm.loading = false;

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

  function reconfigure() {
    vm.state = '';
    session.debtorList = [];
  }

  function imprimer() {
    print();
  }

  function error(err) {
    console.log(err);
  }
}
