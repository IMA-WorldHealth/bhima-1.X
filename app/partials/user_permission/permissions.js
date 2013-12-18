angular.module('kpk.controllers')
.controller('userController', function($scope, $q, $translate, kpkConnect, connect) {
  //initilaisation var  
  $scope.selected = {};
  $scope.chkTous = false;
  $scope.showbadpassword=false;
  $scope.showbademail = false;
  $scope.showbadusername = false;

  var parents = {tables:{'unit':{columns:['id','name']}},
             where:['unit.parent=0']
  }
  var enfants = {tables:{'unit':{columns:['id', 'name', 'description', 'parent']}}
  }
  var users = {tables:{'user':{columns:['id', 'username', 'email', 'password', 'first', 'last', 'logged_in']}}
  }

  $q.all([connect.req(parents), connect.req(enfants), connect.req(users)]).then(function(resultats){
    $scope.model = resultats[2].data;
    $scope.roles = resultats[0].data;
    $scope.units = resultats[1].data;
    for(var i=0; i<$scope.units.length; i++){
      $scope.units[i].chkUnitModel = false;
    }
  });

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

    var autorisations = {tables:{'permission':{columns:['id_unit']}},
                         where:['permission.id_user='+idUser]
    }
    $q.all([connect.req(autorisations)]).then(function(resultats){
      def.resolve(resultats[0].data);
    });
    return def.promise;
  }

  $scope.isSelected = function() {    
    return !!($scope.selected);
  }

  $scope.createUser = function() { 
    $scope.selected = {};   
  }

  $scope.changeAll = function(){
    ($scope.chkTous)?checkAll(): unCheckAll();
  }

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
  }

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
  }

  function creer (){
    var result = existe();
    result.then(function(resp){
      if(resp !== true){
        $scope.showbadusername = false;
        var user = {id:'', username: $scope.selected.username, password: $scope.selected.password,
                   first: $scope.selected.first, last: $scope.selected.last, email: $scope.selected.email, logged_in:0}
        connect.basicPut('user', [user]).then(function(res){
          if(res.status == 200){
            var lastUser = {tables:{'user':{columns:['id']}},
                            where:['user.username='+$scope.selected.username, 'AND', 'user.password='+$scope.selected.password]
            }
            $q.all([connect.req(lastUser)]).then(function(result){
              var i;
              for(i=0; i<$scope.units.length; i++){
                if($scope.units[i].chkUnitModel === true && $scope.units[i].parent !==0 && $scope.units[i].id != 0){
                  connect.basicPut('permission', [{id:'', id_unit: $scope.units[i].id, id_user:result[0].data[0].id}]);
                }
              }              
              refreshUserModel();
            });
          }
        });    
      }else{
        $scope.showbadusername = true;
      }
    });
  }

  $scope.delete = function(){
    if($scope.selected.id){
      kpkConnect.delete('user', $scope.selected.id);
      $scope.selected = {};
      refreshUserModel();
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
    $q.all([connect.req(users)]).then(function(resultats){
      $scope.model = resultats[0].data;
      $scope.selected={};
      $scope.confirmpw = "";
      $scope.showbadpassword = false;
      $scope.showbademail = false;
    });
  }

  function updateUser(){
    $scope.showbadusername = false;   
    var datas = [{id:$scope.selected.id, username: $scope.selected.username,
                  password: $scope.selected.password, first: $scope.selected.first,
                  last: $scope.selected.last, email:$scope.selected.email}
                ];

    connect.basicDelete('permission','id_user', $scope.selected.id);
    connect.basicPost('user', datas, ['id']).then(function(res){
          if(res.status == 200){
            for(var i = 0; i<$scope.units.length; i++){
              if($scope.units[i].chkUnitModel === true && $scope.units[i].parent !==0 && $scope.units[i].id != 0){
                connect.basicPut('permission', [{id:'', id_unit: $scope.units[i].id, id_user:$scope.selected.id}]);
              }
            }
          }
        });
    refreshUserModel();
  }

  function existe(){
    var def = $q.defer();
    var sql = {tables:{'user':{columns:['id']}},
               where:['user.username='+$scope.selected.username]
    }
    $q.all([connect.req(sql)]).then(function(resultats){
      (resultats[0].data.length>0)?def.resolve(true):def.resolve(false);
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
