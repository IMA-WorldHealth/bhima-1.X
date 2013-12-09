angular.module('kpk.controllers')
.controller('creditorsController', function($scope, $q, $modal, kpkConnect, connect) {

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
    var req_db = {};
    req_db.e = [{t:'supplier', c:['id', 'name', 'address_1', 'address_2', 'location_id', 'creditor_id', 'email', 'fax', 'note', 'phone', 'international', 'locked']}];
    kpkConnect.get('/data/?', req_db).then(function(data){
      $scope.creditors = data;
    });
  }
  function getGroups(){
    var req_db = {};
    req_db.e = [{t:'creditor_group', c:['id', 'group_txt', 'account_id']}];
    kpkConnect.get('/data/?', req_db).then(function(data){
      $scope.groups = data;
    });
  }

  function getLocations(){
    var req_db = {};

    req_db.e = [{t:'location', c:['id', 'city', 'region']}];
    kpkConnect.get('/data/?', req_db).then(function(data){
      $scope.locations = data;
    });
  }

  $scope.showDialog = function() {
    var instance = $modal.open({
    templateUrl: "/partials/creditor/creditor-modal.html",
    backdrop: true,
    controller: function($scope, $modalInstance, selectedAcc, kpkConnect) {
      $scope.group = {};
      var models = $scope.models = {};
      //populating accounts
      getAccounts();
      function getAccounts() {
        var req = {tables : {'account' : {columns: ["id", "account_number", "account_txt"]}}};
        connect.req(req).then(function (dependency) {
          models.account = dependency.data;
        });
        /*
        var req_db = {};
        req_db.e = [{t:'account', c:['id', 'account_number', 'account_txt']}];
        req_db.c = [{t:'account', cl:'locked', z:'=', v:0, l:'AND'}, {t:'account', cl:'account_number', z:'>=', v:400000, l:'AND'}, {t:'account', cl:'account_number', z:'<', v:500000}];
        kpkConnect.get('/data/?', req_db).then(function(data){
          $scope.accounts = data;
        });
        */
      }

      function formatAccount (account) {
        return [account.account_number, account.account_txt].join(' ');
      }

      $scope.formatAccount = formatAccount;
        
      $scope.close = function() {
        $modalInstance.dismiss();
      };
      $scope.submit = function() {
        $modalInstance.close({group:$scope.group.group, account:$scope.group.account_id});
      };
    },
    resolve: {
      selectedAcc: function() {
        return 'hello';
      },
    }
    });
    instance.result.then(function(values) {
      kpkConnect.send('creditor_group', [{id:'', group_txt:values.group, account_id:values.account.id}]);
      getGroups();
    }, function() {
      //console.log('dedrick');
    });
  };

  $scope.verifyExisting = function(){
   if($scope.creditorExiste ==0){
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
   }
  }

  $scope.fill = function(index){
    //getCreditors();
    $scope.creditorExiste = 0;
    $scope.creditor = $scope.creditors[index];
    $scope.creditor.international = toBoolean($scope.creditor.international);
    $scope.creditor.locked = toBoolean($scope.creditor.locked);
    $scope.creditor.location_id = getCreditorLocation($scope.creditors[index].location_id);
    var id_promise = getCreditorGroupId($scope.creditors[index].creditor_id);
    id_promise.then(function(value){
      $scope.creditor_group = getCreditorGroup(value.id);
    });
  }

  $scope.save = function(creditor, creditor_group){
    creditor.location_id = extractId(creditor.location_id);
    var creditor_group_id = extractId(creditor_group);
    var result = existe(creditor.id);
    result.then(function(response){
      if(response){             

        var sql_update = {t:'supplier', data:[creditor],pk:["id"]};
        kpkConnect.update(sql_update);
        $scope.creditor={};
        $scope.creditor_group = {};
        $scope.creditorExiste = 0;
        getCreditors();
      }else{
        //on insert
        var creditor_id_promise = getCreditorId(creditor_group_id);
        creditor_id_promise.then(function(value){
          creditor.creditor_id = value;
          kpkConnect.send('supplier', [creditor]);
        $scope.creditor={};
        $scope.creditor_group = {};
        $scope.creditorExiste = 0;
        getCreditors();
        });
      }
      
    });
  }

  function getCreditorId(id){
    var def = $q.defer();
    kpkConnect.send('creditor', [{id:'', creditor_group_id:id}]);
    var request = {}; 
    request.e = [{t : 'creditor', c : ['id']}];
    request.c = [{t:'creditor', cl:'id', v:'LAST_INSERT_ID()', z:'='}];
    kpkConnect.get('data/?',request).then(function(data) {
      console.log(data);
      def.resolve(data[0].id);

    });
    return def.promise;
  }

  function existe(id){
    var def = $q.defer(); // Best to do: if (id === undefined) def.resolve(false);
    if(id){
      var request = {}; 
      request.e = [{t : 'creditor', c : ['id']}];
      request.c = [{t:'creditor', cl:'id', v:id, z:'='}];
      kpkConnect.get('data/?',request).then(function(data) {
       (data.length > 0)?def.resolve(true):def.resolve(false);    
      });
    }else{
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

  function getCreditorGroupId(idCreditor){
    var def = $q.defer();    
    var req_db = {};
    req_db.e = [{t:'creditor', c:['creditor_group_id']}];
    req_db.c = [{t:'creditor', cl:'id', z:'=', v:idCreditor}];
    kpkConnect.get('/data/?', req_db).then(function(data){
      var groupID = data[0].creditor_group_id;
      req_db.e = [{t:'creditor_group', c:['id']}];
      req_db.c = [{t:'creditor_group', cl:'id', z:'=', v:groupID}];
      kpkConnect.get('/data/?', req_db).then(function(data){
      def.resolve(data[0]);
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

  $scope.delete = function(creditor){

    kpkConnect.delete('supplier', creditor.id);
    $scope.creditor = {};
    getCreditors();
  }
 });
