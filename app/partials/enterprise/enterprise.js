angular.module('kpk.controllers')
.controller('enterpriseController', function($scope, $q, connect, appstate) {
  var imports = {},
      models = $scope.models = {},
      flags = $scope.flags = {},
      swap = $scope.swap = {},
      stores = {},
      dependencies = ['enterprise', 'account', 'location', 'currency', 'province', 'country', 'village', 'sector'];

  imports.enterprise_id = appstate.get('enterprise').id;
  imports.enterprise = {
    tables : { 'enterprise' : { columns : ['id', 'name', 'abbr', 'email', 'phone', 'location_id', 'cash_account', 'logo', 'currency_id']}}
  };
  imports.accounts = {
    tables : {'account' : { columns : ['id', 'account_number', 'account_txt', 'locked']}},
    where : ['account.enterprise_id=' + imports.enterprise_id]
  };
  imports.location = {
    tables : {'location' : { columns : ['id', 'village_id', 'province_id', 'sector_id', 'country_id']}}
  };
  imports.province = {tables : {'province' : { columns : ['id', 'name'] }}};
  imports.country = {tables : {'country' : { columns : ['id', 'country_en'] }}};
  imports.village = {tables : {'village' : { columns : ['id', 'name'] }}};
  imports.sector = {tables : {'sector' : { columns : ['id', 'name'] }}};

  imports.currency = {
    tables : { 'currency' : { columns : ['id', 'symbol', 'name'] }}
  };

  function initialize () {
    $q.all([
      connect.req(imports.enterprise),
      connect.req(imports.accounts),
      connect.req(imports.location),
      connect.req(imports.currency),
      connect.req(imports.province),
      connect.req(imports.country),
      connect.req(imports.village),
      connect.req(imports.sector)
    ])
    .then(function (array) {
      array.forEach(function (depend, idx) {
        stores[dependencies[idx]] = depend;
        models[dependencies[idx]] = depend.data;
      });
      console.log(stores.enterprise);
    });
  }

  function formatLocation (l) {
    return stores.location ? [stores.village.get(l.village_id).name, stores.sector.get(l.sector_id).name, stores.province.get(l.province_id).name, stores.country.get(l.country_id).country_en].join(' -- ') : '';
  }

  function formatAccount (account) {
    // FIXME/TODO: Different label for accounts that are locked.
    // Is it possible to disable them using angular's select?
    return [account.account_txt, account.account_number].join(' :: ');
  }

  function formatAccountNumber (account_id) {
    return (stores.account) ? stores.account.get(account_id).account_number : '';
  }

  function load (enterprise) {
    flags.new = false;
    $scope.swap = enterprise;
  }

  function save () {
    var data = connect.clean($scope.swap);
    if (flags.new) {
      connect.basicPut('enterprise', [data])
      .then(function (success) {
        console.log('data posted successfully');
        // TODO: make this truly async so that no reload is necessary
        console.log('success:', success.data.insertId);
        initialize();
      }, function (error) {
        console.log('There was an error!');
      });
    } else {
      connect.basicPost('enterprise', [data], ['id'])
      .then(function (success) { 
        console.log('data put successfully');
        initialize();
      }, function (error) {
        console.log('there was an error!');
      });
    }
  }

  function clear () {
    $scope.swap = {};
    flags.new = true;
  }

  $scope.formatAccount = formatAccount;
  $scope.formatAccountNumber = formatAccountNumber;
  $scope.formatLocation = formatLocation;
  $scope.load = load;
  $scope.save = save;
  $scope.clear = clear;

  initialize();

});
