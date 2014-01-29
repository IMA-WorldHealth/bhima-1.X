angular.module('kpk.controllers')
.controller('principalAnalysisCenter', function ($scope, $q, connect, appstate, messenger) {
  'use strict';

  //variables init
  var requettes = {}, models = $scope.models = {}, enterprise = appstate.get('enterprise');
  requettes.pricipal_centers = {
    tables : {'principal_center':{columns:['id', 'text', 'note']}, 
              'enterprise' : {columns :['name']}},
    join : ['principal_center.enterprise_id=enterprise.id']
  }


  //fonctions

  function init (records){
    models.principal_centers = records[0].data;
  }

  function run (){
    $q.all([connect.req(requettes.pricipal_centers)]).then(init);
  }

  //invocation
  run();
});