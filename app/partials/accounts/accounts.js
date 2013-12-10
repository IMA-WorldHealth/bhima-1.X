angular.module('kpk.controllers')
.controller('accountController', function($scope, $q, $modal, connect, appstate) {
  // This module displays the chart of accounts
  // It should have facility for editing, displaying
  // and locking accounts

  'use strict';

  function loadData () {
    var imports = {};

    imports.enterpriseid = appstate.get("enterprise").id;

    imports.account = {
      tables: {
        'account': {columns: ['enterprise_id', 'id', 'account_number', 'account_txt', 'account_category_id', 'account_type_id', 'fixed']},
        'account_type': {columns: ['type']}
      },
      join: ['account.account_type_id=account_type.id'],
      where: ["account.enterprise_id=" + imports.enterpriseid],
    };

    imports.account_type = {tables: {'account_type' : {columns: ['id', 'type']}}};
    imports.account_category = {tables: {'account_category' : {columns : ['id', 'title']}}};
    
    return $q.all([connect.req(imports.account), connect.req(imports.account_type), connect.req(imports.account_category)]);
  }

  function initGrid () {
    var grid, columns, options, dataview;
   
    // dataview config 
    dataview = new Slick.Data.DataView();

    dataview.onRowCountChanged.subscribe(function (e, args) {
      grid.updateRowCount();
      grid.render(); 
    });

    dataview.onRowsChanged.subscribe(function (e, args) {
      grid.invalidate(args.rows);
      grid.render();
    });

    columns = [
      {id: "account_number" , name: "Account Number", field: "account_number", sortable: true},
      {id: "txt"      , name: "Account Text"     , field: "account_txt", sortable: true},
      {id: "type"     , name: "Account Type"     , field: "type"},
      {id: "category" , name: "Account Category" , field: "account_category_id", sortable: true, formatter: formatAccountCategory},
      {id: "fixed"    , name: "Fixed/Variable"   , field: "fixed", formatter: formatFixed},
      {id: "locked"   , name: "Locked"           , field: "locked", sortable: true, formatter: formatLocked}
    ];

    options = {
      editable             : true,
      autoEdit             : false,
      asyncEditorLoading   : false,
      enableCellNavigation : true,
      forceFitColumns      : true
    };

    grid = new Slick.Grid("#kpk-accounts-grid", dataview, columns, options);

    function sorter (e, args) {
      var field = args.sortCol.field;
      function sort (a, b) { return (a[field] > b[field]) ? 1 : -1; }
      dataview.sort(sort, args.sortAsc);
      grid.invalidate();
    }

    grid.onSort.subscribe(sorter);

    function formatFixed (row, col, item) {
      return item === 1 ? "Fixed" : "Variable";
    }

    function formatLocked (row, col, item) {
      return item === 1 ? "True" : "False";
    }

    function formatAccountCategory (row, col, item) {
      return $scope.stores.account_category ? $scope.stores.account_category.get(item).title : item;
    }

    return {grid: grid, dataview: dataview};

  }

  var promise = loadData();
 
  $scope.models = {};
  $scope.stores = {};
  var dataview, grid;

  promise.then(function (a) {
    $scope.stores.accounts = a[0];
    $scope.models.accounts = a[0].data;
    $scope.stores.types = a[1];
    $scope.models.types = a[1].data;
    $scope.stores.account_category = a[2];
    var setup = initGrid(); 
    grid = setup.grid;
    $scope.dataview = setup.dataview;
    
    $scope.$watch('models.accounts', function () {
      console.log("model changed!");
      $scope.dataview.setItems($scope.models.accounts);
    });
  });

  $scope.create = function () {
    var instance = $modal.open({
      templateUrl: "/partials/accounts/templates/chart-modal.html",
      backdrop: true,
      controller: function ($scope, $modalInstance, types) {
        // work around because of issue #969
        $scope.$modalInstance = $modalInstance;
        $scope.types = types;
      },
      resolve: {
        types: function() {
          return $scope.models.types;
        },
      }
    });

    instance.result.then(function(account) {
      account.id = $scope.stores.accounts.generateid();
      account.enterprise_id = appstate.get('enterprise').id;
      $scope.stores.accounts.post(account);
      // TODO: This works, but have to refresh grid to make it work.
      $scope.dataview.setItems($scope.models.accounts);
    }, function() {});
  };

});

angular.module('kpk.controllers').controller('accountFormController', function ($scope) {
      $scope.account = {};
      // $scope.account.locked = 0;
      $scope.close = function () {
        $scope.$modalInstance.dismiss(); 
      };
      $scope.submit = function () {
        if ($scope.accountForm.$invalid) $scope.invalid = true;
        else $scope.$modalInstance.close($scope.account);
      };
  });
