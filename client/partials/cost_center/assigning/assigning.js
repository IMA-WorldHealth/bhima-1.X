angular.module('kpk.controllers')
.controller('assigning', [
  '$scope',
  '$q',
  'connect',
  'appstate',
  'messenger',
  function ($scope, $q, connect, appstate, messenger) {

    //variables init
    var requettes = {},
        auxiliairy_centers = [],
        principal_centers = [],
        enterprise = appstate.get('enterprise'), // FIXME: this is dangerous.  Enterprise may not exist
        models = $scope.models = {};

    requettes.cost_centers = {
      tables : {
        'cost_center' : {
          columns : ['id', 'text', 'note', 'cost', 'pc']
        },
        'enterprise' : {
          columns : ['name']
        }
      },
      join : ['cost_center.enterprise_id=enterprise.id']
    };

    requettes.criteres = {
      tables : {'critere':{columns:['id', 'critere_txt', 'note']}}
    };

    $scope.selection={};
    $scope.auxiliairy_center_selected = {};
    $scope.go = {};

    //fonctions

    function run (){
      $q.all([
        connect.req(requettes.cost_centers),
        connect.req(requettes.criteres)
      ]).then(init);
    }

    function init (records){
      models.cost_centers = records[0].data;
      models.criteres = records[1].data;
      groupCenters();
      //defineTypeCenter(models.cost_centers);
      updateChecks(false);
    }

    function defineTypeCenter(tbl){
      tbl.map(function (item){
        item.type = (item.pc)? "Principal Center" : "Auxiliairy Center";
      });
    }

    function groupCenters (){
      models.cost_centers.forEach(function (item){
        if (item.pc) {
          principal_centers.push(item);
        } else {
          auxiliairy_centers.push(item);
        }
      });
    }

    function checkAll (){
      models.cost_centers.forEach(function (item){
        if(item.pc) item.checked = $scope.selection.all;
      });
    }

    function updateChecks (value){
      principal_centers.map(function (item){
        if(item.pc) item.checked = value;
      });
    }

    function setAction(action, index){
      $scope.action = action;
      $scope.auxiliairy_center_selected = auxiliairy_centers[index];
    }

    function isChoosen(){
      var choosen = false;
      for(var i=0; i<principal_centers.length; i += 1){
        if (principal_centers[i].checked){
          choosen =true;
          break;
        }
      }
      return choosen;
    }

    function start() {
      if(isChoosen()){
        $scope.auxiliairy_center_selected.cost = getCost($scope.auxiliairy_center_selected.id);
        $scope.principal_centers_selected = format(getPrincipalSelected());
        $scope.go="ok";
      }else{
        $scope.go="";
        messenger.danger('No principal center selected!');
      }
    }

    function format(array){
      array.map(function (item){
        item.criteriaValue = 0;
        item.initialCost = getCost(item.id);
        item.allocatedCost = 0;
        item.totalCost = item.initialCost + item.allocatedCost;
      });
      return array;
    }

    function getCost(center_id){
      return 100;
    }

    function getPrincipalSelected(){
      return principal_centers.filter(function (item){
        return item.checked === true;
      });
    }

    function calculate (){

      var somCritereValue = 0;
      $scope.principal_centers_selected.forEach(function (item){
        somCritereValue+=item.criteriaValue;
      });

      //console.log(somCritereValue);

      $scope.principal_centers_selected.forEach(function (item){
        item.allocatedCost = $scope.auxiliairy_center_selected.cost * (item.criteriaValue / somCritereValue);
        item.totalCost = item.initialCost + item.allocatedCost;
      });
    }

    function apply(){

    }

    //exposition
    $scope.principal_centers = principal_centers;
    $scope.auxiliairy_centers = auxiliairy_centers;
    $scope.checkAll = checkAll;
    $scope.setAction = setAction;
    $scope.start = start;
    $scope.calculate = calculate;


    //invocation

    run();

  }
]);
