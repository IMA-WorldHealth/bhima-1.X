angular.module('kpk.controllers')
.controller('conventionController', [
  '$scope',
  '$q',
  'connect',
  'appstate',
  'messenger',
  function ($scope, $q, connect, appstate, messenger) {
  //variables init

  var requettes = {}, models = $scope.models = {}, stores = {}, enterprise = appstate.get('enterprise');
  requettes.convention = {
    tables : {'convention':{columns:['id', 'name', 'account_id', 'location_id', 'phone', 'email', 'note', 'max_credit']}, 
              'account' : {columns :['id', 'account_number']}},
    join : ['convention.account_id=account.id']
  }

  requettes.account = {
    tables : { 'account':{ columns: ["id", "account_number", "account_txt"]}},
    where : ['account.enterprise_id=' + enterprise.id]
  };

  //fonctions

  function init (records){
    models.conventions = records[0].data;
    models.accounts = records[1].data;
  }

  $scope.fill = function (index){
    $scope.convention = models.conventions[index];
  }

  function formatAccount (account){    
    return [account.account_number, account.account_txt].join(' -- ');
  }

  function getLocations(){
    connect.fetch('/location').then(function (result) {
      models.locations = result.data;
    });
  }

  function formatLocation (l) {
    return [l.village, l.sector, l.province, l.country].join(' -- ');
  }

  function run (){
    $q.all([connect.req(requettes.convention), connect.req(requettes.account)]).then(init);
  }

  function save (convention){
    connect.basicPut('convention', [connect.clean(convention)]);
  }

  //invocation
  getLocations();
  run();

  $scope.formatAccount = formatAccount;
  $scope.formatLocation = formatLocation;
  $scope.save = save;

});
