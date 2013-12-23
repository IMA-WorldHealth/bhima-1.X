angular.module('kpk.controllers').controller('treeController', function($scope, $q, $location, appcache, connect) {    
    // This module loads the tree.
    // Rewrite Dec 12th so that tree only sends one XHR request,
    // rather than several recursively for optimisation purposes.
    'use strict';
    var deferred = $q.defer();
    var result = getRoles();
    $scope.treeData = [];
    var cb = function(role, units){
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

    };

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

    function getRoles(){
      var request = {
        tables : {'unit' : { columns : ['id', 'name'] }},
        where : ['unit.parent='+0]
      };
      connect.fetch(request).then(function (data) { 
        deferred.resolve(data);
      });
      return deferred.promise;
  }

  function getChildren(role, callback){
    var request = {
      tables : { 'unit' : { columns: ['id', 'name', 'url']}},
      where : ['unit.parent='+role.id]
    };
    connect.fetch(request).then(function (data) {
        callback(role, data); 
    });
  }

});
