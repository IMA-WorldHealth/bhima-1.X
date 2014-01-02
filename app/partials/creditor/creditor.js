angular.module('kpk.controllers')
.controller('creditorsController', function ($scope, $q, connect) {
  'use strict';

  //initialisations
  $scope.creditor = {};
  $scope.creditorExiste = 0;
  
  //populating creditors
  getCreditors();

  //populating group
  getGroups();

  //populating location
  getLocations();

  //les fonctions
  function getCreditors () {
    var sql = {tables:{'supplier':{columns:['id', 'name', 'address_1', 'address_2', 'location_id', 'creditor_id', 'email', 'fax', 'note', 'phone', 'international', 'locked']}}};
    connect.req(sql).then(function (resultat) {
      $scope.creditors = resultat.data;
    });
  }

  function getGroups(){
    var sql = {tables:{'creditor_group':{columns:['id', 'group_txt', 'account_id']}}};
    connect.req(sql).then(function (resultat) {
      $scope.groups = resultat.data;
    });
  }

  function getLocations(){
    connect.fetch('/location').then(function (result) {
      $scope.locations = result.data;
    });
  }

  function formatLocation (l) {
    return [l.village, l.sector, l.province, l.country].join(' -- ');
  }

  $scope.verifyExisting = function(){
   if ($scope.creditorExiste === 0) {
    if ($scope.creditor.name) {
      if (isThere($scope.creditors, name, $scope.creditor.name)) {
        var sql = {tables:{'supplier':{columns:{c:['id', 'name', 'address_1', 'address_2', 'location_id', 'creditor_id', 'email', 'fax', 'note', 'phone', 'international', 'locked']}}},
                    where: ['supplier.name='+$scope.creditor.name]
                  };
        connect.req(sql).then(function (resultat) {
          if (resultat) {
            getCreditorGroupId(resultat.data[0].creditor_id)
            .then(function (value) {
              $scope.creditor_group = getCreditorGroup(value.id);
            });
            resultat.data[0].location_id = getCreditorLocation(resultat.data[0].location_id);
            resultat.data[0].international = toBoolean(resultat.data[0].international);
            resultat.data[0].locked = toBoolean(resultat.data[0].locked);
            $scope.creditor = resultat.data[0];
            $scope.creditorExiste = 1;
           }
        });
      }
    }
   }
  };

  $scope.fill = function(index){
    //getCreditors();
    $scope.creditorExiste = 0;
    $scope.creditor = $scope.creditors[index];
    $scope.creditor.international = toBoolean($scope.creditor.international);
    $scope.creditor.locked = toBoolean($scope.creditor.locked);
    $scope.creditor.location_id = getCreditorLocation($scope.creditors[index].location_id);
    getCreditorGroupId($scope.creditors[index].creditor_id)
    .then(function (value) {
      $scope.creditor_group = getCreditorGroup(value.id);
    });
  };

  $scope.save = function(creditor, creditor_group){
    creditor.location_id = extractId(creditor.location_id);
    var creditor_group_id = extractId(creditor_group);
    var result = existe(creditor.id);
    result.then(function(response){
      if (response ){ 

        var sql_update = {t:'supplier', data:[creditor],pk:['id']};
        connect.basicPost(sql_update.t, sql_update.data, sql_update.pk);
        $scope.creditor={};
        $scope.creditor_group = {};
        $scope.creditorExiste = 0;
        getCreditors();
      }else{
        //on insert
        var creditor_id_promise = getCreditorId(creditor_group_id);
        creditor_id_promise.then(function(value){
          creditor.creditor_id = value;
          connect.basicPut('supplier', [creditor]);
        $scope.creditor={};
        $scope.creditor_group = {};
        $scope.creditorExiste = 0;
        getCreditors();
        });
      }
    });
  };

  function getCreditorId(id){
    var def = $q.defer();
    connect.basicPut('creditor', [{id:'', creditor_group_id:id, text:$scope.creditor.name}]).then(function(res){
      if (res.status == 200) def.resolve(res.data.insertId);
    });
    return def.promise;
  }

  function existe (id) {
    var def = $q.defer(); // Best to do: if (id === undefined) def.resolve(false);
    if (id) { // this may be bad because if id === 0 this will fail...
    
      var sql = {
        tables: {'supplier': { columns:['id']}},
        where: ['supplier.id='+id]
      };
      connect.req(sql).then(function (resultat) {
        def.resolve(resultat.data.length !== 0);
      });
    } else {
      def.resolve(false);
    }
    return def.promise;
  }

  function toBoolean(number){
    return number>0; // or !!number, if number is nonnegative
  }

  function extractId(obj){
    return obj.id;
  }

  function getCreditorLocation(idLocation){
    var indice = -1;
    for(var i = 0; i<$scope.locations.length; i++){
      if($scope.locations[i].id == idLocation){
        indice = i;
        break;
      }
    }
    if (indice!=-1){
      return $scope.locations[indice];
    }else{
      return {};
    }
  }

  function getCreditorGroup(idGroup){
    var indice = -1;
    for(var i = 0; i<$scope.groups.length; i++){
      if($scope.groups[i].id == idGroup){
        indice = i;
        break;
      }
    }
    if (indice!=-1){
      return $scope.groups[indice];
    }else{
      return {};
    }
  }

  function getCreditorGroupId (idCreditor) {
    var def = $q.defer();    

    var sql = {
      tables: {'creditor':{columns:['creditor_group_id']}},
      where: ['creditor.id='+idCreditor]
    };
    connect.req(sql).then(function (resultat) {
      sql = {
        tables: {'creditor_group': {columns:['id']}},
        where: ['creditor_group.id='+resultat.data[0].creditor_group_id]
      };
      connect.req(sql).then(function (resultat2) {
        def.resolve(resultat2.data[0]);
      });

    });
    return def.promise;
  }

  function isThere(jsontab, cle, value){
    var indice = -1;
    for(var i = 0; i<jsontab.length; i++){
      if(jsontab[i][cle] == value){
        indice = i;
        break;
      }
    }
    // this can be return indice != -1;
    if (indice!=-1){
      return true;
    }else{
      return false;
    }
  }

  $scope.lock = function (creditor) {
    connect.basicPost('supplier', [{id : creditor.id, locked: creditor.locked}], ["id"]);
  };

  $scope.delete = function () {
    connect.basicDelete('supplier', $scope.creditor.id);
    $scope.creditor = {};
    getCreditors();
  };

  $scope.formatLocation = formatLocation;

 });
