angular.module('kpk.controllers')
.controller('enterpriseController', function($scope, $q, connect, appstate) {
  var imports = {},
      models = $scope.models = {},
      flags = $scope.flags = {},
      swap = $scope.swap = {},
      stores = {},
      dependencies = ['enterprise', 'account', 'currency'];

  imports.enterprise = {
    tables : { 'enterprise' : { columns : ['id', 'name', 'abbr', 'email', 'phone', 'location_id', 'logo', 'currency_id']}}
  };
  imports.accounts = {
    tables : {'account' : { columns : ['id', 'account_number', 'account_txt', 'locked']}}
    // where : ['account.enterprise_id=' + imports.enterprise_id]
  };
  imports.currency = {
    tables : { 'currency' : { columns : ['id', 'symbol', 'name'] }}
  };
  
  //appstate doesn't gaurantee page has already loaded for 'get', a registered callback will be executed when the value is ready // imports.enterprise_id = appstate.get('enterprise').id;
  appstate.register('enterprise', function(res) { 
    imports.enterprise_id = res.id;
    
    //assign to query
    imports.accounts.where = ['account.enterprise_id=' + imports.enterprise_id];
    initialize();
  });

  function initialize () {
    $q.all([
      connect.req(imports.enterprise),
      connect.req(imports.accounts),
      connect.req(imports.currency)
    ])
    .then(function (array) {
      array.forEach(function (depend, idx) {
        console.log('set', depend, idx);
        stores[dependencies[idx]] = depend;
        models[dependencies[idx]] = depend.data;
      });
      
      connect.fetch('/location/')
      .then(function (result) {
        console.log("Got location data:", result.data);
        models.location = result.data;
      }, function (error) {
        console.error("found an error:", error);
      });

    });
  }

  function formatLocation (l) {
    return [l.village, l.sector, l.province, l.country].join(' -- ');
  }

  function formatAccount (account) {
    // FIXME/TODO: Different label for accounts that are locked.
    // Is it possible to disable them using angular's select?
    return [account.account_txt, account.account_number].join(' :: ');
  }

  function formatAccountNumber (account_id) {
    var account = stores.account.get(account_id);
    if(account) return (stores.account) ? account.account_number : '';
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

});
