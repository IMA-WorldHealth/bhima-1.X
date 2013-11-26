angular.module('kpk.controllers').controller('createAccountController', function($scope, $q, connect) { 
  console.log("createAccountController initialised");

  $scope.model = {};
  $scope.model['accounts'] = {'data' : []};

//  Request
  var account_request = {
    'tables' : {
      'account' : {
        'columns' : ["id", "account_txt", "account_type_id", "fixed"]
      }
    }
  }

  //  grid options
  var grid;
  var dataview;
  var sort_column = "id";
  var columns = [
    {id: 'id', name: 'No.', field: 'id', sortable: true, maxWidth: 80},
    {id: 'account_txt', name: 'Text', field: 'account_txt'},
    {id: 'account_type_id', name: 'Type', field: 'account_type_id', maxWidth: 60},
    {id: 'fixed', name: 'Fixed', field: 'fixed', maxWidth: 60}
  ];
  var options = {
    enableCellNavigation: true,
    enableColumnReorder: true,
    forceFitColumns: true,
    /*Bootstrap style row height*/
    rowHeight: 30
  };

  function init() { 

    connect.req(account_request).then(function(res) { 
      $scope.model['accounts'] = res;
      console.log($scope.model['accounts'].data);
      grid = new Slick.Grid('#account_grid', $scope.model['accounts'].data, columns, options);
    })
  }

  init();
});