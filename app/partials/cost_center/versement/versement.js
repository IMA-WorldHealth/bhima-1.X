angular.module('kpk.controllers')
.controller('versement', [
  '$scope',
  '$q',
  'connect',
  'appstate',
  'messenger',
  'validate',
  function ($scope, $q, connect, appstate, messenger, validate) {

    var dependencies= {};
    dependencies.cost_centers = {
      query : {
        tables : {
          'cost_center' : {
            columns : ['id', 'text', 'note', 'cost']
          },
          'project' : {
            columns :['name']
          }
        },
        join : ['cost_center.project_id=project.id']
      }
    }
    function init (model){
      $scope.model = model;
      filling();
    }

    function filling (){
      getAvailablesAccounts($scope.project.enterprise_id)
      .then(function (records){
        $scope.model.available_accounts = records;
        console.log('[records]', records);
      })
    }

    function getAvailablesAccounts (enterprise_id){
      var def = $q.defer();
      connect.fetch('/availableAccounts/'+enterprise_id+'/')
      .then(function(values){
        def.resolve(values);
      });
      return def.promise;
    }

    appstate.register('project', function (project){
      $scope.project = project;
      validate.process(dependencies).then(init);
    })







  }
]);
