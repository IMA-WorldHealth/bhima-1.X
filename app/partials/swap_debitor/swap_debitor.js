angular.module('kpk.controllers').controller('swapDebitor', function($scope, $q, $location, $http, $routeParams, validate, connect, appstate, messenger, $filter) {
 
  
  var dependencies = {}; 
  $scope.noEmpty = false; 
  $scope.debitor = {};
  dependencies.changer = {
    query : 'user_session'
  };

  dependencies.debtorGroup = {
    query : { tables : {'debitor_group' : {'columns' : ['id', 'name', 'note']}}}
  };

  function swap(model) {
    $scope.model = model;
    $scope.locationDebitor = model.location.data[0]; 

  }

  function initialiseSwaping (selectedDebitor) {
    if(!selectedDebitor) return messenger.danger('No debtor selected');
    connect.req({
        tables : {
          'debitor' : {
            columns : ['group_id']
          }
        },
        where : [
          'debitor.id=' + selectedDebitor.debitor_id
        ]
    }).then(function(res){
      $scope.debitor.debitor_group_id = res.data[0].group_id;
      $scope.selectedDebitor = selectedDebitor;
      $scope.noEmpty = true;
      dependencies.location = { query : '/location/' + $scope.selectedDebitor.origin_location_id};
      validate.process(dependencies).then(swap);
    });
  }

  function swapGroup (selectedDebitor){
    var debitor = {id : selectedDebitor.debitor_id, group_id : $scope.debitor.debitor_group_id};
    console.log('le debitor',debitor);
    connect.basicPost('debitor', [connect.clean(debitor)], ['id']).then(handleSucces, handleError);    

  }

  function handleSucces(){
    messenger.success($filter('translate')('SWAPDEBITOR.SUCCES'));
    $scope.selectedDebitor = {};
    $scope.debitor = {};
    $scope.noEmpty = false;
  }

  function handleError(){
    messenger.danger($filter('translate')('SWAPDEBITOR.DANGER'));
  }
  $scope.initialiseSwaping = initialiseSwaping; 
  $scope.swapGroup = swapGroup; 
});
