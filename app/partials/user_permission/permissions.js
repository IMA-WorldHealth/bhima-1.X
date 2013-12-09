angular.module('kpk.controllers')
.controller('userController', function($scope, $q, $translate, kpkConnect) {
  //initilaisation var
  
  $scope.selected = {};
  $scope.chkTous = false;
  $scope.showbadpassword=false;
  $scope.showbademail = false;
  $scope.showbadusername = false;

  //population model de table
  getUsers();

  //population model de role
  kpkConnect.fetch("unit", ["id", "name"], 'parent', 0).then(function(data){
    $scope.roles = data;
  });

  //population model d'unite
  kpkConnect.fetch("unit", ["id", "name", "description", "parent"]).then(function(data) { 
    $scope.units = data;
    for(var i=0; i<$scope.units.length; i++){
      $scope.units[i].chkUnitModel = false;
    }    
  });

  //**************** les fonctions *****************
  function getUsers(){
    var request = {}; 
  request.e = [{t : 'user', c : ['id', 'username', 'email', 'password','first', 'last', 'logged_in']}];
  kpkConnect.get('/data/?',request).then(function(data) { 
    $scope.model = data;
  });
  }
  $scope.cancel = function(){
    $scope.selected = {};
    unCheckAll();
  };

  $scope.select = function(index) {
    unCheckAll();
    $scope.selected = $scope.model[index];
    var result = getUserUnits($scope.selected.id);    
    result.then(function(vals){
      for(var i=0; i<vals.length; i++){
        for(var j = 0; j<$scope.units.length; j++){
          if($scope.units[j].id == vals[i].id_unit){
            $scope.units[j].chkUnitModel = true;
          }
        }
      }
    });
  }

  function getUserUnits(idUser){
    var def = $q.defer();
    var request = {}; 
    request.e = [{t : 'permission', c : ['id_unit']}];
    request.c = [{t:'permission', cl:'id_user', v:idUser, z:'='}];
    kpkConnect.get('/data/?', request).then(function (data){      
      def.resolve(data);
    });
    return def.promise;
  }

  $scope.isSelected = function() {    
    return !!($scope.selected);
  }

  $scope.createUser = function() { 
    $scope.selected = {};   
  };

  $scope.changeAll = function(){
    ($scope.chkTous)?checkAll(): unCheckAll();
  };

  $scope.getUnits = function(idRole){
    $scope.tabUnits = [];
    if($scope.units) { 
      for(var i = 0; i < $scope.units.length; i++){
        if($scope.units[i].parent == idRole){
          $scope.tabUnits.push($scope.units[i]);
        }
      }

      return $scope.tabUnits;
    }
    return [];    
  };

  $scope.valider = function (){
    if($scope.selected.email){
      var email = $scope.selected.email;
      var indexAt = email.indexOf('@',0);
      var indexDot = email.lastIndexOf('.',email.length);
      //verification email
      if(indexAt!=-1 && indexDot!=-1 && indexAt<indexDot) {
        $scope.showbademail = false; 
      }else{
        $scope.showbademail = true;
      }
    }else{
      $scope.showbademail = true;
    }
     if($scope.selected.password){
        //verification mot de passe    
        if ($scope.selected.password!= $scope.confirmpw){
          $scope.showbadpassword = true;
        }else{
          $scope.showbadpassword = false;
        }
      }else{
        $scope.showbadpassword = true;
      }

    if($scope.showbademail !== true && $scope.showbadpassword!==true){
      ($scope.selected.id)?updateUser():creer();
    }
  };

  function creer (){
    var result = existe();
    result.then(function(resp){
      if(resp !== true){
        $scope.showbadusername = false;
        kpkConnect.send('user', [{id:'',
                   username: $scope.selected.username,
                   password: $scope.selected.password,
                   first: $scope.selected.first,
                   last: $scope.selected.last,
                   email: $scope.selected.email,
                   logged_in:0}]);

    var request = {}; 
        request.e = [{t : 'user', c : ['id']}];
        request.c = [{t:'user', cl:'username', v:$scope.selected.username, z:'=', l:'AND'}, {t:'user', cl:'password', v:$scope.selected.password, z:'='}];
        kpkConnect.get('data/?',request).then(function(data) {           
          for(var i = 0; i<$scope.units.length; i++){
            if($scope.units[i].chkUnitModel === true && $scope.units[i].parent !==0 && $scope.units[i].id != 0){
              kpkConnect.send('permission', [{id:'', id_unit: $scope.units[i].id, id_user:data[0].id}]);
            }
          }         
    
    });
    refreshUserModel();
      }else{
        $scope.showbadusername = true;
      }

    });
    
  }

    $scope.delete = function(){
      if($scope.selected.id){
        kpkConnect.delete('user', $scope.selected.id);
        $scope.selected = {};
        getUsers();
      }    
  }
    function checkAll(){
      for(var i=0; i<$scope.units.length; i++){
      $scope.units[i].chkUnitModel = true;
    }
    }

    function unCheckAll(){
      for(var i=0; i<$scope.units.length; i++){
      $scope.units[i].chkUnitModel = false;
    }
    }

    function isAllChecked(){
      var rep = true;
      for(var i = 0; i< $scope.units.length; i++){
        if(!$scope.units[i].chkUnitModel){
          rep = false;
          break;
        }
      }
      return rep;
    }

    function refreshUserModel(){
    var request = {}; 
    request.e = [{t : 'user', c : ['id', 'username', 'email', 'password','first', 'last', 'logged_in']}];
    kpkConnect.get('data/?',request).then(function(data) { 
    $scope.model = data;
    $scope.selected={};
    $scope.confirmpw = "";
    $scope.showbadpassword = false;
    $scope.showbademail = false;
    });
    }

    function updateUser(){
      $scope.showbadusername = false;
      kpkConnect.get('data/?', {t:'permission', ids:{id_user:[$scope.selected.id]}, action:'DEL'});
      var sql_update = {t:'user', 
                        data:[{id:$scope.selected.id,
                               username: $scope.selected.username,
                               password: $scope.selected.password,
                               first: $scope.selected.first,
                               last: $scope.selected.last,
                               email:$scope.selected.email}
                             ], 
                        pk:["id"]
                       };
      kpkConnect.update(sql_update);
      for(var i = 0; i<$scope.units.length; i++){
          if($scope.units[i].chkUnitModel === true && $scope.units[i].parent !==0 && $scope.units[i].id != 0){
            kpkConnect.send('permission', [{id:'', id_unit: $scope.units[i].id, id_user:$scope.selected.id}]);
          }
          } 

      

      refreshUserModel();

    }

    function existe(){
      var def = $q.defer();
      var request = {}; 
      request.e = [{t : 'user', c : ['id']}];
      request.c = [{t:'user', cl:'username', v:$scope.selected.username, z:'='}];
      kpkConnect.get('data/?',request).then(function(data) {
       (data.length > 0)?def.resolve(true):def.resolve(false);    
    });
      return def.promise;
    }
    $scope.manageClickUnit = function(id){
      var value = null;
      for(var i=0; i<$scope.units.length; i++){
        if($scope.units[i].id == id){
          value = $scope.units[i].chkUnitModel;
          break;
        }
      }
      if(value === true){
        //tester si tous sont checkes
        if(isAllChecked()){
          $scope.chkTous=true;
        }else{
          $scope.chkTous = false;
        }

      }else{
        $scope.chkTous=false;

      }
    }  
});
