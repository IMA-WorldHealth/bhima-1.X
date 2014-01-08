// This is horrific code, refactor 
angular.module('kpk.controllers').controller('manageAccount', function($scope, $q, connect) { 
  console.log("manageAccount initialised");
  /*Test page for organising and displaying chart of accounts with aggregate caculcations
  *
  * TODO (/purpose)
  *   -Filter first column of grid, indicate levels of indentation
  *   -Aggregates by nested account groups (olawd)
  *   -Naive sorting, correct order should not be assumed from database
  */

  $scope.model = {};
  $scope.model['accounts'] = {'data' : []};

  var accountRequest = {
    'identifier': 'account_number',
    'tables' : {
      'account' : {
        'columns' : ["id", "account_number", "account_txt", "account_type_id", "fixed", "parent"]
      }
    }
  }
  
  var accountTypeRequest = {
    'tables' : { 
      'account_type' : { 
        'columns' : ["id", "type"]
      }
    }
  }
 
  //tables needed from the server
  var dependencies = ['account', 'account_type'];
  var requests = {};
  
  //TODO initialise all of these in a method
  requests.account = { 
    query: accountRequest,
    model: null,
    test: null,
    required: true
  }
  requests.account_type = { 
    query: accountTypeRequest,
    model: null,
    test: null,
    required: true
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
    {id: 'account_number', name: 'No.', field: 'account_number'},
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

  function manageAccount() { 
    fetchDependencies()
    .then(function(res) { 
      settupGrid();
    });
  }
  
  //TODO pass variables down through each method vs. referencing global variables for everything
  function fetchDependencies() { 
    var requestPromises = [], deferred = $q.defer();
    
    //request queries 
    dependencies.forEach(function(key) { 
      requestPromises.push(connect.req(requests[key].query));  
    });
    
    //receive queries
    $q.all(requestPromises)
    .then(function(res) { 
      dependencies.forEach(function(key, index) { 
        requests[key].model = res[0];
        console.log(requests);
      });

      //validate models
      
      deferred.resolve(dependencies);
    }); 
    return deferred.promise;
  }

  function settupGrid() { 

    awfulIndentCrawl(requests['account'].model.data);
    console.log(requests['account'].model.data);
    var groupItemMetadataProvider = new Slick.Data.GroupItemMetadataProvider();
    dataview = new Slick.Data.DataView({
      groupItemMetadataProvider: groupItemMetadataProvider,
      inlineFilter: true
    });

    data = requests['account'].model.data;
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
    dataview.setItems(requests['account'].model.data);
    dataview.setFilter(accountFilter)
    dataview.endUpdate();
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
      var parent = requests['account'].model.get(item.parent);

      while (parent) {
        if (parent._collapsed) {
          return false;
        }
        parent = requests['account'].model.get(parent.parent);
      }
    }
    return true;
  }

  //runs in O(O(O(...)))
  function awfulIndentCrawl(data) { 
    console.log('got', data);
    data.forEach(function(item, index) { 
      var indent = 0;
      var parent = requests['account'].model.get(item.parent);
      while(parent) { 
        indent++;
        parent = requests['account'].model.get(parent.parent);
      }
      item.indent = indent;
    });
  }
  
  manageAccount();
  // init();
});
