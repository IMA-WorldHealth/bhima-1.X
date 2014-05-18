angular.module('kpk.controllers')
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

    function suivant(){
      $scope.model.selected_pri_cost_centers = $scope.model.pri_cost_centers.data.filter(function (cc){
        return cc.checked;
      });

      $q.all(
        $scope.model.selected_pri_cost_centers.map(function (cc){
          cc.criteriaValue = 0;
          return getCost(cc)
        })
      ).then(function (results){

        console.log('les resultats ...', results);
      })

      $scope.selected_aux_cost_center.cost = 100;
      setAction('suivant');
      calculate();
    }

    function getCost (cc){
      cc.initial_cost = 10;
      return $q.when(10);
    }

    function calculate (){
      var somCritereValue = 0;
      $scope.model.selected_pri_cost_centers.forEach(function (item){
        somCritereValue+=item.criteriaValue;
      });
      $scope.model.selected_pri_cost_centers.forEach(function (item){
        item.allocatedCost = $scope.selected_aux_cost_center.cost * (item.criteriaValue / somCritereValue);
        item.allocatedCost = item.allocatedCost || 0;
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

    validate.process(dependencies)
    .then(init);

    $scope.performChange = performChange;
    $scope.checkAll = checkAll;
    $scope.isForwardable = isForwardable;
    $scope.suivant = suivant;
    $scope.calculate = calculate;
    $scope.getTotalAllocatedCost = getTotalAllocatedCost;
    $scope.getTotal = getTotal;
  }
]);








































//variables init
    // var requettes = {},
    //     auxiliairy_centers = [],
    //     principal_centers = [],
    //     enterprise = appstate.get('enterprise'), // FIXME: this is dangerous.  Enterprise may not exist
    //     models = $scope.models = {};

    // requettes.cost_centers = {
    //   tables : {
    //     'cost_center' : {
    //       columns : ['id', 'text', 'note', 'cost', 'pc']
    //     },
    //     'enterprise' : {
    //       columns : ['name']
    //     }
    //   },
    //   join : ['cost_center.enterprise_id=enterprise.id']
    // };

    // requettes.criteres = {
    //   tables : {'critere':{columns:['id', 'critere_txt', 'note']}}
    // };

    // $scope.selection={};
    // $scope.auxiliairy_center_selected = {};
    // $scope.go = {};

    // //fonctions

    // function run (){
    //   $q.all([
    //     connect.req(requettes.cost_centers),
    //     connect.req(requettes.criteres)
    //   ]).then(init);
    // }

    // function init (records){
    //   models.cost_centers = records[0].data;
    //   models.criteres = records[1].data;
    //   groupCenters();
    //   //defineTypeCenter(models.cost_centers);
    //   updateChecks(false);
    // }

    // function defineTypeCenter(tbl){
    //   tbl.map(function (item){
    //     item.type = (item.pc)? "Principal Center" : "Auxiliairy Center";
    //   });
    // }

    // function groupCenters (){
    //   models.cost_centers.forEach(function (item){
    //     if (item.pc) {
    //       principal_centers.push(item);
    //     } else {
    //       auxiliairy_centers.push(item);
    //     }
    //   });
    // }

    // function checkAll (){
    //   models.cost_centers.forEach(function (item){
    //     if(item.pc) item.checked = $scope.selection.all;
    //   });
    // }

    // function updateChecks (value){
    //   principal_centers.map(function (item){
    //     if(item.pc) item.checked = value;
    //   });
    // }

    // function setAction(action, index){
    //   $scope.action = action;
    //   $scope.auxiliairy_center_selected = auxiliairy_centers[index];
    // }

    // function isChoosen(){
    //   var choosen = false;
    //   for(var i=0; i<principal_centers.length; i += 1){
    //     if (principal_centers[i].checked){
    //       choosen =true;
    //       break;
    //     }
    //   }
    //   return choosen;
    // }

    // function start() {
    //   if(isChoosen()){
    //     $scope.auxiliairy_center_selected.cost = getCost($scope.auxiliairy_center_selected.id);
    //     $scope.principal_centers_selected = format(getPrincipalSelected());
    //     $scope.go="ok";
    //   }else{
    //     $scope.go="";
    //     messenger.danger('No principal center selected!');
    //   }
    // }

    // function format(array){
    //   array.map(function (item){
    //     item.criteriaValue = 0;
    //     item.initialCost = getCost(item.id);
    //     item.allocatedCost = 0;
    //     item.totalCost = item.initialCost + item.allocatedCost;
    //   });
    //   return array;
    // }

    // function getCost(center_id){
    //   return 100;
    // }

    // function getPrincipalSelected(){
    //   return principal_centers.filter(function (item){
    //     return item.checked === true;
    //   });
    // }



    // function apply(){

    // }

    // //exposition
    // $scope.principal_centers = principal_centers;
    // $scope.auxiliairy_centers = auxiliairy_centers;
    // $scope.checkAll = checkAll;
    // $scope.setAction = setAction;
    // $scope.start = start;
    // $scope.calculate = calculate;


    // //invocation

    // run();
