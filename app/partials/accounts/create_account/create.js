// This is horrific code, refactor 
angular.module('kpk.controllers').controller('createAccountController', function($scope, $q, connect) { 
  console.log("createAccountController initialised");
  /*Test page for organising and displaying chart of accounts with aggregate caculcations
  *
  * TODO (/purpose)
  *   -Filter first column of grid, indicate levels of indentation
  *   -Aggregates by nested account groups (olawd)
  *   -Naive sorting, correct order should not be assumed from database
  */

  $scope.model = {};
  $scope.model['accounts'] = {'data' : []};

//  Request
  var account_request = {
    'identifier': 'account_number',
  'tables' : {
      'account' : {
        'columns' : ["id", "account_number", "account_txt", "account_type_id", "fixed", "parent"]
      }
    }
  }
  
  var AccountFormatter = function (row, cell, value, columnDef, dataContext) {
    // value = value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    var spacer = "<span style='display:inline-block;height:1px;width:" + (15 * dataContext["indent"]) + "px'></span>";
    var idx = dataview.getIdxById(dataContext.id);

    console.log('d', dataContext, 'got idx', idx);
    if (data[idx + 1] && data[idx + 1].indent > data[idx].indent) {
      if (dataContext._collapsed) {
        return spacer + " <span class='toggle expanded glyphicon glyphicon-collapse-up'></span>&nbsp; <b>" + value + "</b>";
      } else {
        return spacer + " <span class='toggle collapsed glyphicon glyphicon-collapse-down'></span>&nbsp; <b>" + value + "</b>";
      }
    } else {
      return spacer + " <span class='toggle'></span>&nbsp;" + value;
    }
  };

  //  grid options
  var grid;
  var dataview;
  var data = [];
  var sort_column = "account_number";
  var columns = [
    {id: 'account_txt', name: 'Text', field: 'account_txt', formatter: AccountFormatter},
    {id: 'account_number', name: 'No.', field: 'account_number', sortable: true, sortable: true},
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
      awfulIndentCrawl($scope.model['accounts'].data);
      console.log($scope.model['accounts'].data);
      var groupItemMetadataProvider = new Slick.Data.GroupItemMetadataProvider();
      dataview = new Slick.Data.DataView({
        groupItemMetadataProvider: groupItemMetadataProvider,
        inlineFilter: true
      });

      data = $scope.model['accounts'].data;
      grid = new Slick.Grid('#account_grid', dataview, columns, options);

      grid.registerPlugin(groupItemMetadataProvider);

      grid.onSort.subscribe(function(e, args) {
        sort_column = args.sortCol.field;
        dataview.sort(compareSort, args.sortAsc);
      })

      grid.onClick.subscribe(function(e, args) { 

        if ($(e.target).hasClass("toggle")) {
          var item = dataview.getItem(args.row);
          if (item) {
            if (!item._collapsed) {
              item._collapsed = true;
            } else {
              item._collapsed = false;
            }

            dataview.updateItem(item.id, item);
          }
          e.stopImmediatePropagation();
        }

      })

      dataview.onRowCountChanged.subscribe(function(e, args) { 
        grid.updateRowCount();
        grid.render();
      });

      dataview.onRowsChanged.subscribe(function(e, args) { 
        grid.invalidateRows(args.rows);
        grid.render();
      });

      dataview.beginUpdate();
      dataview.setItems($scope.model['accounts'].data);
      dataview.setFiletr(accountFilter)
      dataview.endUpdate();

      

      // group();
    })

  }

  function compareSort(a, b) {
    console.log("oh loard");
    var x = a[sort_column], y = b[sort_column];
    console.log(x, y);
    return (x == y) ? 0 : (x > y ? 1 : -1);
  }

  function accountFilter(item) {
    //enables collapsed + expanded
    if (item.parent != null) {
      var parent = $scope.model['accounts'].get(item.parent);

      while (parent) {
        if (parent._collapsed) {
          return false;
        }
        parent = $scope.model['accounts'].get(parent.parent);
      }
    }
    return true;
  }

  //runs in O(O(O(...)))
  function awfulIndentCrawl(data) { 
    data.forEach(function(item, index) { 
      var indent = 0;
      var parent = $scope.model['accounts'].get(item.parent);
      while(parent) { 
        indent++;
        parent = $scope.model['accounts'].get(parent.parent);
      }
      item.indent = indent;
    });
  }
  init();
});