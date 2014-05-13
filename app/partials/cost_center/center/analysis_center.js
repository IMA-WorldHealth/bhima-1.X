angular.module('kpk.controllers')
.controller('analysisCenter', [
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

    $scope.register = {}; $scope.selected = {}; $scope.acc2 = {}; $scope.acc = {};

    //fonctions
    function init (model){
      $scope.model = model;
      console.log('one est la ', model);
    }

    function setAction (value, index){
      $scope.action = value;
      // if(value !== 'register') $scope.selected = models.cost_centers[index];
      // if(value === 'configure') {
      //   $scope.selected = models.cost_centers[index];
      //   handleConfigure();
      // }
    }

    function writeCenter (){
      return connect.basicPut('cost_center', connect.clean($scope.register));
    }

    function saveRegistration (){
      $scope.register.project_id = $scope.project.id;
      writeCenter()
      .then(function(){
        messenger.info("successfully inserted");
      })
      .catch(function(err){
        messenger.danger('Errot during inserting.');
      })

      // if (isCorrect()){
      //   $scope.register.enterprise_id = enterprise.id;
      //   connect.basicPut('cost_center', [connect.clean($scope.register)]).
      //   then(function (v){

      //     if(v.status === 200){
      //       messenger.info("successfully inserted");
      //       $scope.register = {};
      //       run();

      //     }

      //   });
      // }else{
      //   messenger.danger('Principal cenetr Name undefined.');
      // }
    }

    function isCorrect(){
      return ($scope.register.text)? true : false;
    }

    function run (){
      $q.all(
        [
          connect.req(requettes.cost_centers),
          getAvailablesAccounts(enterprise.id)
        ])
      .then(init);
    }

    function transformDatas(tabl){
      tabl.map(function (item){
        item.checked = false;
      });
    }

    function checkAll (){
      models.availablesAccounts.forEach(function (item){
        item.checked = $scope.acc.all;
      });
    }

    function checkAll2 (){
      models.associatedAccounts.forEach(function (item){
        item.checked = $scope.acc2.all;
      });
    }

    function getAvailablesAccounts (enterprise_id){
      var def = $q.defer();
      connect.fetch('/availablechargeAccounts/'+enterprise_id+'/')
      .then(function(values){
        def.resolve(values);
      });
      return def.promise;
    }

    function associate (){

      var rek = models.availablesAccounts.filter(function (item){
        return item.checked;
      });

      $q.all(rek.map(function(item){
        item.cc_id = $scope.selected.id;
        delete item.checked;
        return connect.basicPost('account', [connect.clean(item)], ['id']);
      })).then( function(v){
        messenger.info('assignation successfully!');
        run();
        handleConfigure();
      });
    }

    function loadAssociateAccounts (){
      var def = $q.defer();
      connect.fetch('/costCenterAccount/'+enterprise.id+'/'+$scope.selected.id)
      .then(function(values){
        def.resolve(values);
      });
      return def.promise;
    }

    function handleConfigure(){
      loadAssociateAccounts()
      .then(function(values){
        models.associatedAccounts = values;
        transformDatas(models.associatedAccounts);

      });
    }

    function remove(){

      var rek = models.associatedAccounts.filter(function (item){
        return item.checked;
      });

      $q.all(rek.map(function(item){
        item.cc_id = -1;
        delete item.checked;
        return connect.basicPost('account', [connect.clean(item)], ['id']);
      })).then( function(v){
        messenger.info('assignation successfully!');
        run();
        handleConfigure();
      });

    }

    function formatCritere (critere){
      return critere.critere_txt;
    }

    appstate.register('project', function (project){
      $scope.project = project;
      dependencies.cost_centers.where = ['cost_center.project_id='+project.id];
      console.log('on a', project)
      validate.process(dependencies).then(init);
    })

    //exposition

    $scope.setAction = setAction;
    $scope.saveRegistration = saveRegistration;
    $scope.checkAll = checkAll;
    $scope.formatCritere = formatCritere;
    $scope.associate = associate;
    $scope.remove = remove;

    //invocation
    //run();

  }
]);
