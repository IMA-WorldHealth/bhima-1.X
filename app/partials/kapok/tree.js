angular.module('kpk.controllers')
.controller('treeController', function($scope, $q, $location, appcache, connect, kpkConnect) {    
    // This module loads the tree.
    // Rewrite Dec 12th so that tree only sends one XHR request,
    // rather than several recursively for optimisation purposes.
    'use strict';

    var deferred = $q.defer();
    var result = getRoles();
    $scope.treeData = [];
    $scope.$watch('treeData', function () {
      console.log('TREEDATA:', $scope.treeData);
    }, true);

    function cb (role, units){
      var element = {};
      element.label = role.name;
      element.id = role.id;
      element.children = [];

//      Set default element state
      element.collapsed = true;
//      console.log(appcache.checkDB());
      
      if(role.p_url !== '') element.p_url = role.p_url;


      for(var i = 0; i<units.length; i++){
        element.children.push({"label":units[i].name, "id":units[i].id, "p_url":units[i].p_url, "children":[]});
      }
      $scope.treeData.push(element);

    }

    result.then(function(values){
      for(var i = 0; i<values.length; i++){
        getChildren(values[i], cb);
      }
    });
 
    
    $scope.$watch('navtree.currentNode', function( newObj, oldObj ) {
        if( $scope.navtree && angular.isObject($scope.navtree.currentNode) ) {
            var path = $scope.navtree.currentNode.p_url;
            if(path) $location.path(path);
            
        }
    }, true);

    //FIXME: redo this to use connect
    function getRoles(){
      var request = {}; 
      request.e = [{t : 'unit', c : ['id', 'name']}];
      request.c = [{t:'unit', cl:'parent', v:0, z:'='}];
      kpkConnect.get('/tree?',request).then(function(data) { 
        console.log("DATA:", data);
        deferred.resolve(data);
      });
      return deferred.promise;
  }

  function loadTree () {
  }

  function getChildren(role, callback) {
    var request = {}; 
    request.e = [{t : 'unit', c : ['id', 'name', 'url']}];
    request.c = [{t:'unit', cl:'parent', v:role.id, z:'='}];
    kpkConnect.get('/tree?',request).then(function(data) {
      callback(role, data); 
    });

  }

});
