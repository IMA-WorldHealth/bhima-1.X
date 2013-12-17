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
  function getCreditors(){
    /*var req_db = {};
    req_db.e = [{t:'supplier', c:['id', 'name', 'address_1', 'address_2', 'location_id', 'creditor_id', 'email', 'fax', 'note', 'phone', 'international', 'locked']}];
    kpkConnect.get('/data/?', req_db).then(function(data){
      $scope.creditors = data;
    });*/
    var sql = {tables:{'supplier':{columns:['id', 'name', 'address_1', 'address_2', 'location_id', 'creditor_id', 'email', 'fax', 'note', 'phone', 'international', 'locked']}}};
    connect.req(sql).then(function (resultat) {
      $scope.creditors = resultat.data;
    });
  }
  function getGroups(){
    /*var req_db = {};
    req_db.e = [{t:'creditor_group', c:['id', 'group_txt', 'account_id']}];
    kpkConnect.get('/data/?', req_db).then(function(data){
      $scope.groups = data;
    });*/

    var sql = {tables:{'creditor_group':{columns:['id', 'group_txt', 'account_id']}}};
    connect.req(sql).then(function (resultat) {
      $scope.groups = resultat.data;
    });
  }

  function getLocations(){
   /* var req_db = {};
    req_db.e = [{t:'location', c:['id', 'city', 'region']}];
    kpkConnect.get('/data/?', req_db).then(function(data){
      $scope.locations = data;
    });*/

    var sql = {tables:{'location':{columns:['id', 'city', 'region']}}};
    connect.req(sql).then(function (resultat) {
      $scope.locations = resultat.data;
    });
  }

  $scope.verifyExisting = function(){
   /*if ($scope.creditorExiste === 0) {
       if($scope.creditor.name){
        if(isThere($scope.creditors, 'name', $scope.creditor.name)){
          var req_db = {};
          req_db.e = [{t:'supplier', c:['id', 'name', 'address_1', 'address_2', 'location_id', 'creditor_id', 'email', 'fax', 'note', 'phone', 'international', 'locked']}];
          req_db.c = [{t:'supplier', cl:'name', z:'=', v:$scope.creditor.name}];
          kpkConnect.get('/data/?', req_db).then(function(data){
           if(data.length>0){
            var id_promise = getCreditorGroupId(data[0].creditor_id);
            id_promise.then(function(value){
              $scope.creditor_group = getCreditorGroup(value.id);
            });
            data[0].location_id = getCreditorLocation(data[0].location_id);
            data[0].international = toBoolean(data[0].international);
            data[0].locked = toBoolean(data[0].locked);
            $scope.creditor = data[0];
            $scope.creditorExiste = 1;
           }        
          });
        }
      }
   }*/

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
        //kpkConnect.update(sql_update);
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
          //kpkConnect.send('supplier', [creditor]);
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
    /*kpkConnect.send('creditor', [{id:'', creditor_group_id:id, text:$scope.creditor.name}]);    
    var request = {}; 
    request.e = [{t : 'creditor', c : ['id']}];
    request.c = [{t:'creditor', cl:'id', v:'LAST_INSERT_ID()', z:'='}];
    kpkConnect.get('data/?',request).then(function(data) {
      console.log(data);
      def.resolve(data[0].id);
    });
    connect.basicPut('creditor', [{id:'', creditor_group_id:id, text:$scope.creditor.name}]);
    var sql = {tables:{'creditor':{columns:['id']}},
           where:['creditor.id=LAST_INSERT_ID()']
    };*/

    connect.basicPut('creditor', [{id:'', creditor_group_id:id, text:$scope.creditor.name}]).then(function(res){
      if (res.status == 200) def.resolve(res.data.insertId);
    });
    return def.promise;
  }

  function existe (id) {
    var def = $q.defer(); // Best to do: if (id === undefined) def.resolve(false);
    if (id) { // this may be bad because if id === 0 this will fail...
      /*var request = {}; 
      request.e = [{t : 'creditor', c : ['id']}];
      request.c = [{t:'creditor', cl:'id', v:id, z:'='}];
      kpkConnect.get('data/?',request).then(function(data) {
        def.resolve(data.length > 0);
      });*/
    
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
    // var req_db = {};
    // req_db.e = [{t:'creditor', c:['creditor_group_id']}];
    // req_db.c = [{t:'creditor', cl:'id', z:'=', v:idCreditor}];
    // kpkConnect.get('/data/?', req_db).then(function(data){
    //   var groupID = data[0].creditor_group_id;
    //   req_db.e = [{t:'creditor_group', c:['id']}];
    //   req_db.c = [{t:'creditor_group', cl:'id', z:'=', v:groupID}];
    //   kpkConnect.get('/data/?', req_db).then(function(data){
    //   def.resolve(data[0]);
    //   });
    // });

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

  $scope.delete = function(creditor) {
    //kpkConnect.delete('supplier', creditor.id);
    connect.basicDelete('supplier', creditor.id);
    $scope.creditor = {};
    getCreditors();
  };
 });
