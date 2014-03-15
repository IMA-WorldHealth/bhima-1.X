angular.module('kpk.controllers').controller('swapDebitor', function($scope, $q, $location, $http, $routeParams, validate, connect, appstate, messenger, $filter, uuid) {
 
  
  var dependencies = {}; 
  $scope.noEmpty = false; 
  $scope.debitor = {};
  dependencies.changer = {
    query : 'user_session'
  };

  dependencies.debtorGroup = {
    query : { 
      identifier : 'uuid',
      tables : {'debitor_group' : {'columns' : ['uuid', 'name', 'note']}}
    }
  };

  function swap(model) {
    $scope.model = model;
    $scope.locationDebitor = model.location.data[0]; 

  }

  function initialiseSwaping (selectedDebitor) {
    if(!selectedDebitor) return messenger.danger('No debtor selected');
    console.log('selectedDebitor', selectedDebitor); 
    connect.req({
        tables : {
          'debitor' : {
            columns : ['group_uuid']
          }
        },
        where : [
          'debitor.uuid=' + selectedDebitor.debitor_uuid
        ]
    }).then(function(res){
      $scope.debitor.debitor_group_uuid = res.data[0].group_uuid;
      $scope.selectedDebitor = selectedDebitor;
      $scope.noEmpty = true;
      dependencies.location = { 
        query : '/location/' + $scope.selectedDebitor.origin_location_id
      };
      validate.process(dependencies).then(swap);
    });
  }

  function swapGroup (selectedDebitor){
    var debitor = {uuid : selectedDebitor.debitor_uuid, group_uuid : $scope.debitor.debitor_group_uuid};
    connect.basicPost('debitor', [connect.clean(debitor)], ['uuid'])
    .then(function(res) {
      var packageHistory = {
        uuid : uuid(),
        debitor_uuid : selectedDebitor.debitor_uuid,
        debitor_group_uuid : $scope.debitor.debitor_group_uuid,
        user_id : $scope.model.changer.data.id
      }
      connect.basicPut('debitor_group_history', [connect.clean(packageHistory)]).then(handleSucces, handleError);
  }, handleError);  

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
