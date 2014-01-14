// This is horrific code, refactor 
angular.module('kpk.controllers').controller('manageAccount', function($scope, $q, connect, appstate, messenger) { 
  console.log("manageAccount initialised");
  /*Test page for organising and displaying chart of accounts with aggregate caculcations
  *
  * TODO (/purpose)
  *   -Filter first column of grid, indicate levels of indentation
  *   -Aggregates by nested account groups (olawd)
  *   -Naive sorting, correct order should not be assumed from database
  */
  
  //TODO replace all 'requests['account'].model' -> '$scope.models['account']'
  $scope.model = {};

  //Defines state of the unit, updated from view
  $scope.formState = "display";
  var TITLE_ACCOUNT = 3;

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

  var queueSubmissions = [];
  
  var AccountFormatter = function (row, cell, value, columnDef, dataContext) {
    // value = value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    var spacer = "<span style='display:inline-block;height:1px;width:" + (15 * dataContext["indent"]) + "px'></span>";
    var idx = dataview.getIdxById(dataContext.id);
   
    //raw hacks, don't even know why I try
    if(dataContext.account_type_id === TITLE_ACCOUNT) { 
    // if (data[idx + 1] && data[idx + 1].indent > data[idx].indent) {
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

      //get enterprise details
      appstate.register('enterprise', function(res) { 
        $scope.enterprise = res;
      });
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
        requests[key].model = res[index];
      });

      //validate models
      
      //temporary smashing together of models
      dependencies.forEach(function(key, index) { 
        $scope.model[key] = requests[key].model;
      });

      //set default selection for new account FIXME do this somewhere else 
      $scope.newAccount = {
        'type': $scope.model['account_type'].data[0],
        'fixed': 'true', 
        //FIXME doesn't select default
      };
  
      deferred.resolve(dependencies);
    }); 
    return deferred.promise;
  }
  
  $scope.submitAccount = function submitAccount(account) {
    //do some kind of validation
    //kill if account exists for now 
    if($scope.model['account'].get(account.number)) { 
      messenger.push({type: 'danger', msg: 'Account number already exists'});
      return;
    }

    //format account
    var formatAccount = { 
      account_type_id: account.type.id,
      account_number: account.number,
      account_txt: account.title,
      fixed: account.fixed === "true" ? 1 : 0,
      enterprise_id: appstate.get('enterprise').id,
      parent: 0 //set default parent (root)
    }
    
    if(account.parent) formatAccount.parent = account.parent.account_number;

    connect.basicPut("account", [formatAccount]).then(function(res) { 
      formatAccount.id = res.data.insertId;
      $scope.model['account'].post(formatAccount);
      dataview.refresh();

      //reset form
      $scope.newAccount.title = "";
      $scope.newAccount.number = "";
      
      if(formatAccount.account_type_id === TITLE_ACCOUNT) { 
        console.log('update parent');
        $scope.newAccount.parent = $scope.model['account'].get(formatAccount.account_number);
        console.log($scope.newAccount.parent);
      }

    }, function(err) { 
      messenger.push({type: 'danger', msg: 'Could not insert account: ' + err}); 
    });
  }

  function settupGrid() { 

    awfulIndentCrawl(requests['account'].model.data);
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
      console.log('THIS'); 
      grid.updateRowCount();
      dataview.beginUpdate();
      awfulIndentCrawl(requests['account'].model.data);
      dataview.sort(ohadaSort, true);
      requests['account'].model.recalculateIndex();
      dataview.setFilter(accountFilter);
      dataview.refresh(); 
      dataview.endUpdate();  
      grid.render();
    });

    dataview.onRowsChanged.subscribe(function(e, args) { 
      grid.invalidateRows(args.rows);
      grid.render();
    });
  
    dataview.beginUpdate();
    dataview.setItems(requests['account'].model.data);
    dataview.sort(ohadaSort, true);
    requests['account'].model.recalculateIndex();
    dataview.setFilter(accountFilter);
    dataview.endUpdate();
  }

  function ohadaSort(a, b) {
    var x = String(a[sort_column]), y = String(b[sort_column]);
 
    return (x == y) ? 0 : (x > y ? 1 : -1);
  }

  function accountFilter(item) {
    //enables collapsed + expanded
    var limit = 0, max = 20;
    if (item.parent != null) {
      var parent = requests['account'].model.get(item.parent);
      while (parent) {

        //debugging infinite loop of ID lookups - resolved with recalculating indexes on sort
        limit++; 
        if(limit > max) { 
          console.log(parent, 'crashed with infinite loop');
          console.log('first', requests['account'].model.get(311));
          console.log('second', requests['account'].model.get(3120));
          console.log(requests['account'].model);
          return false;
        } 
        // console.log('currentParent', parent);
        if (parent._collapsed) {
          return false;
        }
        parent = requests['account'].model.get(parent.parent);
        // console.log('newParent', parent);
      }
    }
    return true;
  }

  //runs in O(O(O(...)))
  function awfulIndentCrawl(data) { 
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
  
  $scope.updateState = function updateState(newState) { 
    $scope.formState = newState;
  }
  manageAccount();
  // init();
});
