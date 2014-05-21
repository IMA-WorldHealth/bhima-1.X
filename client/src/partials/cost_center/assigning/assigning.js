angular.module('bhima.controllers')
.controller('assigning', [
  '$scope',
  '$q',
  'connect',
  'appstate',
  'messenger',
  'validate',
  function ($scope, $q, connect, appstate, messenger, validate) {
    var dependencies = {};
    $scope.configuration = {};
    dependencies.aux_cost_centers = {
      query : {
        tables : {
          'cost_center' : {
            columns : ['id', 'text', 'note', 'cost']
          },
          'project' : {
            columns :['name']
          }
        },
        join : ['cost_center.project_id=project.id'],
        where : ['cost_center.is_principal=0']
      }
    }

    dependencies.pri_cost_centers = {
      query : {
        tables : {
          'cost_center' : {
            columns : ['id', 'text', 'note', 'cost']
          },
          'project' : {
            columns :['name']
          }
        },
        join : ['cost_center.project_id=project.id'],
        where : ['cost_center.is_principal=1']
      }
    }

    function init (model) {
      $scope.model = model;
      $scope.cc = {};
      $scope.cc.all = false;
      window.model = model;
    }

    function performChange (){
      $scope.selected_aux_cost_center = JSON.parse($scope.configuration.aux_cost_center);
      // loadCenterAccount()
      // .then(function (results){
      //   $scope.model.associatedAccounts = results;
      // })
    }

    function isForwardable (){
      if (!$scope.selected_aux_cost_center) return false;
      if(!$scope.model.pri_cost_centers.data.length) return false;
      return $scope.model.pri_cost_centers.data.some(function (account){
        return account.checked;
      })
    }

    function checkAll(){
      $scope.model.pri_cost_centers.data.forEach(function (item){
        item.checked = $scope.cc.all;
      });
    }

    function setAction (action){
      $scope.action = action;

    }

    function processSelectedCost (cc){
      var def = $q.defer();
      connect.req('/cost/'+$scope.project.id+'/'+cc.id)
      .then(function(values){
        def.resolve(values);
      });
      return def.promise;
    }

    function suivant(){
      $scope.model.selected_pri_cost_centers = $scope.model.pri_cost_centers.data.filter(function (cc){
        return cc.checked;
      });

      processSelectedCost($scope.selected_aux_cost_center)
      .then(handleResult)
      .then(processPrincipalsCenters)
      .then(handleResults)
      .then(function(){
        setAction('suivant');
        calculate();
      });
    }

    function processPrincipalsCenters() {
      $scope.model.selected_pri_cost_centers.forEach(function (pc){
        pc.criteriaValue = 1;
      });
      return $q.all(
        $scope.model.selected_pri_cost_centers.map(function (pc) {
          return processSelectedCost(pc);
        })
      );
    }

    function handleResult (cout){
      $scope.selected_aux_cost_center.cost = cout.data.cost;
      return $q.when();
    }

    function handleResults (couts){
      couts.forEach(function (cout, index){
        $scope.model.selected_pri_cost_centers[index].initial_cost = cout.data.cost;
      });
      return $q.when();
    }

    function calculate (){
      var somCritereValue = 0;
      $scope.model.selected_pri_cost_centers.forEach(function (item){
        somCritereValue+=item.criteriaValue;
      });
      $scope.model.selected_pri_cost_centers.forEach(function (item){
        item.allocatedCost = $scope.selected_aux_cost_center.cost * (item.criteriaValue / somCritereValue);
        item.allocatedCost = item.allocatedCost || 0;
        console.log('initial cost is :', item.initial_cost);
        item.totalCost = item.initial_cost + item.allocatedCost;
      });
    }

    function getTotalAllocatedCost (){
      var som = 0;
      $scope.model.selected_pri_cost_centers.forEach(function (item){
        som+= item.allocatedCost || 0;
      });
      return som;
    }

    function getTotal (){
      var som = 0;
      $scope.model.selected_pri_cost_centers.forEach(function (item){
        som+= item.totalCost || 0;
      });
      return som;
    }

    appstate.register('project', function (project){
      $scope.project = project;
      validate.process(dependencies)
      .then(init);
    })

    $scope.performChange = performChange;
    $scope.checkAll = checkAll;
    $scope.isForwardable = isForwardable;
    $scope.suivant = suivant;
    $scope.calculate = calculate;
    $scope.getTotalAllocatedCost = getTotalAllocatedCost;
    $scope.getTotal = getTotal;
  }
]);
