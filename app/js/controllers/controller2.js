angular.module('kpk.controllers').controller('fiscalController', function($scope, $q, connect, appstate) { 
    $scope.active = "select";
    $scope.selected = null;
    $scope.create = false;

    $scope.new_model = {'year' : 'true'};

//    $scope.previous_fiscal

//   Temporary output vars
    var out_count = 0;

    function init() { 
      //Resposible for getting the current values of selects
      appstate.register("enterprise", function(res) { 
        loadEnterprise(res.id);
        //Reveal to scope for info display
        $scope.enterprise = res;
        console.log("Appstate returned", res);
      });

      //This isn't required - should this be included?
      appstate.register("fiscal", function(res) { 
        console.log("resolving", res);
        $scope.select(res.id);
      });
    }

    function loadEnterprise(enterprise_id) { 
      var fiscal_model = {};

      var promise = loadFiscal(enterprise_id);
      promise
      .then(function(res) { 
        fiscal_model = res;
        //FIXME: select should be a local function (returning a promise), it can then be exposed (/used) by a method on $scope
        //expose model
        $scope.fiscal_model = fiscal_model;
        //select default
        console.log("s", $scope);
        if(fiscal_model.data[0]) $scope.select(fiscal_model.data[0].id);

      })
    }

    function loadFiscal(enterprise_id) {  
      var deferred = $q.defer();
      var fiscal_query = {
        'tables' : {
          'fiscal_year' : {
            'columns' : ["id", "number_of_months", "fiscal_year_txt", "transaction_start_number", "transaction_stop_number", "start_month", "start_year", "previous_fiscal_year"]
          }
        },
        'where' : ['fiscal_year.enterprise_id=' + enterprise_id]
      }
      connect.req(fiscal_query).then(function(model) {
        deferred.resolve(model);
      });
      return deferred.promise;
    }
    

    $scope.select = function(fiscal_id) {
      if($scope.fiscal_model) { 
        fetchPeriods(fiscal_id);
        $scope.selected = $scope.fiscal_model.get(fiscal_id);
        $scope.active = "update";
      } 
    };

    $scope.delete = function(fiscal_id) { 
      //validate deletion before performing
      $scope.active = "select";
      $scope.selected = null;
      $scope.fiscal_model.delete(fiscal_id);
    };

    $scope.isSelected = function() { 
      return !!($scope.selected);
    };

    $scope.isFullYear = function() {
      if($scope.new_model.year == "true") return true;
      return false;
    }

    $scope.$watch('new_model.start', function(oval, nval) {
      if($scope.isFullYear()) updateEnd();
    })

    function updateEnd() {
      var s = $scope.new_model.start;
      if(s) {
//        Pretty gross
        var ds = new Date(s);
        var iterate = new Date(ds.getFullYear() + 1, ds.getMonth() - 1);
//        Correct format for HTML5 date element
        $scope.new_model.end = inputDate(iterate);
        console.log($scope.new_model.end);
      }

    }

    $scope.createFiscal = function() { 
      //Do some session checking to see if any values need to be saved/ flushed to server
      $scope.active = "create";
      $scope.selected = null;

      //Fetch data about previous fiscal year if it doesn't already exist

    };

    $scope.getFiscalStart = function() { 
      if($scope.period_model) {
        var t = $scope.period_model[0];
        if(t) return t.period_start;
      }
    };

    $scope.getFiscalEnd = function() {
      if($scope.period_model) { 
        var l = $scope.period_model;
        var t = l[l.length-1];
        if(t) return t.period_stop;
      }
    };


    $scope.generateFiscal = function generateFiscal(model) {
//      temporary defer
      var deferred = $q.defer();

      var enterprise = $scope.enterprise;
      var transaction_start_number, transaction_stop_number, fiscal_year_number;
      var insertId;

//      extract month data
      var start = new Date(model.start);
      var end = new Date(model.end);

//      TODO default for now
      transaction_start_number = 0;
      transaction_stop_number = 0;
      fiscal_year_number = 1;

//      Temporary output
      $scope.progress = {};

//      Validation

//      Years must be valid
      if(!(start < end)) {
        updateProgress("Start date must be before end date");
        return;
      }

//      validation complete - wrap object
      var fiscal_object = {
        enterprise_id: enterprise.id,
        number_of_months: diff_month(start, end) + 1, //hacky - change diff_month
        fiscal_year_txt: model.note,
        start_month: start.getMonth() + 1,
        start_year: start.getFullYear()
      }
      updateProgress('Fiscal year object packaged');

//      create fiscal year record in database
      var promise = getPrevious();
      promise
        .then(function(res) {
          console.log(res.previous_fiscal_year == null);
          if(res.previous_fiscal_year != null) fiscal_object.previous_fiscal_year = res.previous_fiscal_year;
          return putFiscal(fiscal_object);
        })
        .then(function(res) {

//        generate periods and write records to database
          insertId = res.data.insertId;
          return generatePeriods(insertId, start, end);
        }).then(function(res) {
          updateProgress("[Transaction Success] All required records created");
//          TODO add to local model temporarily, commit to server should be made through local model
          fiscal_object.id = insertId;
          $scope.fiscal_model.post(fiscal_object);
          deferred.resolve();

          // generate budget for account/ period
          // ?generate period totals
          
          //Reset model
          $scope.new_model = {};

          //Select year
          $scope.select(fiscal_object.id);
          $scope.progress = {};
        });

        return deferred.promise;
    }

    function getPrevious() {
      var deferred = $q.defer();

      connect.basicGet("/fiscal/101/")
        .then(function(res) {
          deferred.resolve(res.data);
        });

      return deferred.promise;
    }

    function putFiscal(fiscal_object) {
      var deferred = $q.defer();
      connect.basicPut('fiscal_year', [fiscal_object])
        .then(function(res) {
          updateProgress('Record created in "fiscal_year" table');
          deferred.resolve(res);
        });
//      create budget records assigned to periods and accounts

//      create required monthTotal records

      return deferred.promise;
    }

    function generatePeriods(fiscal_id, start, end) {
      var deferred = $q.defer();
      //      create period records assigned to fiscal year
      //201308
      var request = [];
      var total = diff_month(start, end) + 1;
      for(var i = 0; i < total; i++) {
//        oh lawd, so many Dates
        var next_month = new Date(start.getFullYear(), start.getMonth() + i);
        var max_month = new Date(next_month.getFullYear(), next_month.getMonth() + 1, 0);

        var period_start = mysqlDate(next_month);
        var period_stop = mysqlDate(max_month);

        var period_object = {
          fiscal_year_id: fiscal_id,
          period_start: period_start,
          period_stop: period_stop
        }
        updateProgress('Period object ' + period_start + ' packaged');
        request.push(connect.basicPut('period', [period_object]));
      }
      updateProgress('Request made for [' + request.length + '] period records');

      $q.all(request)
        .then(function(res) {
          updateProgress('All period records written successfully');
          deferred.resolve(res);
        })


      return deferred.promise;
    }

    function fetchPeriods(fiscal_id) {
      var period_query = {
        'tables' : {
          'period' : {
            'columns' : ["id", "period_start", "period_stop"]
          }
        },
        'where' : ['period.fiscal_year_id=' + fiscal_id]
      }
      connect.req(period_query).then(function(model) {
        $scope.period_model = model.data;
      });
    }

//  Utilities
    function diff_month(d1, d2) {
//      ohgawd rushing
      var res;

//      Diff months
      res = d2.getMonth() - d1.getMonth();

//      Account for year
      res += (d2.getFullYear() - d1.getFullYear()) * 12;
      res = Math.abs(res);
      return res <=0 ? 0 : res;
    }

  function inputDate(date) {
    //Format the current date according to RFC3339 (for HTML input[type=="date"])
    return date.getFullYear() + "-" + ('0' + (date.getMonth() + 1)).slice(-2);
  }

  function mysqlDate(date) {
    return date.getFullYear() + "-" + ('0' + (date.getMonth() + 1)).slice(-2) + "-" + ('0' + date.getDate()).slice(-2);
  }

  function updateProgress(body) {
    if(!$scope.progress) $scope.progress = {};
    out_count++;
    $scope.progress[out_count] =  body;
  }

    //Initialise after scope etc. has been set
    init();
  });
angular.module('kpk.controllers').controller('journalController', function($scope, $translate, $compile, $timeout, $q, $modal, connect){

  $scope.model = {};
  $scope.model['journal'] = {'data' : []};

//  Request
  var journal_request = {
    'tables' : {
      'posting_journal' : {
        'columns' : ["id", "trans_id", "trans_date", "doc_num", "description", "account_id", "debit", "credit", "currency_id", "deb_cred_id", "deb_cred_type", "inv_po_id", "debit_equiv", "credit_equiv"]
      }
    }
  }

  //TODO iterate thorugh columns array - apply translate to each heading and update
  //(each should go through translate initially as well)
  $scope.$on('$translateChangeSuccess', function () {
    //grid.updateColumnHeader("trans_id", $translate('GENERAL_LEDGER'));
  });

//  grid options
  var grid;
  var dataview;
  var sort_column = "trans_id";
  var columns = [
    {id: 'trans_id', name: "ID", field: 'trans_id', sortable: true},
    {id: 'trans_date', name: 'Date', field: 'trans_date'},
    {id: 'doc_num', name: 'Doc No.', field: 'doc_num', maxWidth: 75},
    {id: 'description', name: 'Description', field: 'description', width: 110},
    {id: 'account_id', name: 'Account ID', field: 'account_id', sortable: true},
    {id: 'debit', name: 'Debit', field: 'debit', groupTotalsFormatter: totalFormat, sortable: true, maxWidth:100},
    {id: 'credit', name: 'Credit', field: 'credit', groupTotalsFormatter: totalFormat, sortable: true, maxWidth: 100},
    {id: 'deb_cred_id', name: 'AR/AP Account', field: 'deb_cred_id'},
    {id: 'deb_cred_type', name: 'AR/AP Type', field: 'deb_cred_type'},
    {id: 'inv_po_id', name: 'Inv/PO Number', field: 'inv_po_id'},
    {id: 'del', name: '', width: 10, formatter: formatBtn}
  ];
  var options = {
    enableCellNavigation: true,
    enableColumnReorder: true,
    forceFitColumns: true,
    rowHeight: 30
  };

  function init() {

    connect.req(journal_request).then(function(res) {
      $scope.model['journal'] = res;

      var groupItemMetadataProvider = new Slick.Data.GroupItemMetadataProvider();
      dataview = new Slick.Data.DataView({
        groupItemMetadataProvider: groupItemMetadataProvider,
        inlineFilter: true
      });
      grid = new Slick.Grid('#journal_grid', dataview, columns, options);

      grid.registerPlugin(groupItemMetadataProvider);
//      Cell selection
//      grid.setSelectionModel(new Slick.CellSelectionModel());

      grid.onSort.subscribe(function(e, args) {
        sort_column = args.sortCol.field;
        dataview.sort(compareSort, args.sortAsc);
      })

      dataview.onRowCountChanged.subscribe(function (e, args) {
        grid.updateRowCount();
        grid.render();
      });

      dataview.onRowsChanged.subscribe(function (e, args) {
        grid.invalidateRows(args.rows);
        grid.render();
      });



//      Set for context menu column selection
//      var columnpicker = new Slick.Controls.ColumnPicker(columns, grid, options);

      dataview.beginUpdate();
      dataview.setItems($scope.model['journal'].data);
//      $scope.groupByID()
      dataview.endUpdate();
      console.log("d", dataview);
      console.log("d.g", dataview.getItems());

    })

  }

  $scope.groupByID = function groupByID() {
    dataview.setGrouping({
      getter: "trans_id",
      formatter: function (g) {
        return "<span style='font-weight: bold'>" + g.value + "</span> (" + g.count + " transactions)</span>";
      },
      aggregators: [
        new Slick.Data.Aggregators.Sum("debit"),
        new Slick.Data.Aggregators.Sum("credit")
      ],
      aggregateCollapsed: false
    });
  }

  $scope.groupByAccount = function groupByAccount() {
    dataview.setGrouping({
      getter: "account_id",
      formatter: function(g) {
        return "<span style='font-weight: bold'>" + g.value + "</span>"
      },
      aggregators: [
        new Slick.Data.Aggregators.Sum("debit"),
        new Slick.Data.Aggregators.Sum("credit")
      ],
      aggregateCollapsed: false
    });
  }

  $scope.removeGroup = function removeGroup() {
    dataview.setGrouping({});
  }

  function compareSort(a, b) {
    var x = a[sort_column], y = b[sort_column];
    return (x == y) ? 0 : (x > y ? 1 : -1);
  }

  function formatBtn() {
    return "<a class='ng-scope' ng-click='splitTransaction()'><span class='glyphicon glyphicon-th-list'></span></a>";
  }

  function totalFormat(totals, column) {

    var format = {};
    format['Credit'] = '#02BD02';
    format['Debit'] = '#F70303';

    var val = totals.sum && totals.sum[column.field];
    if (val != null) {
      return "<span style='font-weight: bold; color:" + format[column.name] + "'>" + ((Math.round(parseFloat(val)*100)/100)) + "</span>";
    }
    return "";
  }

  $scope.splitTransaction = function splitTransaction() {
    console.log("func is called");
    var instance = $modal.open({
      templateUrl: "split.html",
      controller: function ($scope, $modalInstance) { //groupStore, accountModel
        console.log("Group module initialised");

      },
      resolve: {
        //groupStore: function () { return stores.inv_group; },
        //accountModel: function () { return $scope.models.account; }
      }
    });
  }

  //good lawd hacks
  //FIXME: without a delay of (roughly)>100ms slickgrid throws an error saying CSS can't be found
//  $timeout(init, 100);


  init();
});
angular.module('kpk.controllers').controller('patientRegController', function($scope, $q, $location, connect, $modal, kpkConnect, appstate) {
    console.log("Patient init");
    var patient_model = {};
    var submitted = false;
    var default_patientID = 1;


    function init() { 
      //register patient for appcahce namespace
      var default_group = 3 //internal patient

      var location_request = connect.req({'tables' : {'location' : {'columns' : ['id', 'city', 'region']}}});
      //This was if we needed to create alpha-numeric (specific) ID's
      var patient_request = connect.req({'tables' : {'patient' : {'columns' : ['id']}}});
      //Used to generate debtor ID for patient
      //      FIXME just take the most recent items from the database, vs everything?
      var debtor_request = connect.req({'tables' : {'debitor' : {'columns' : ['id']}}});
      var debtor_group_request = connect.req({'tables' : {'debitor_group' : {'columns' : ['id', 'name', 'note']}}});

      $q.all([location_request, patient_request, debtor_request, debtor_group_request])
      .then(function(res) { 
        $scope.location_model = res[0];
        $scope.patient_model = res[1];
        $scope.debtor_model = res[2];
        $scope.debtor_group_model = res[3];
        //$scope.location = $scope.location_model.data[0]; //select default

        $scope.debtor = {};
        //$scope.debtor.debtor_group = $scope.debtor_group_model.get(default_group);
      });
    }

    function createId(data) {
      console.log(data);
      if(data.length===0) return default_patientID;
      var search = data.reduce(function(a, b) { a = a.id || a; return Math.max(a, b.id)});
      console.log("found", search);
      // quick fix
      search  = (search.id !== undefined) ? search.id : search;
      //if(search.id) search = search.id;
      return search + 1;
    }

    $scope.update = function(patient) {
      //      download latest patient and debtor tables, calc ID's and update
      var patient_request = connect.req({'tables' : {'patient' : {'columns' : ['id']}}});
      var debtor_request = connect.req({'tables' : {'debitor' : {'columns' : ['id']}}});

      var patient_model, debtor_model;

      //      TODO verify patient data is valid

      $q.all([debtor_request, patient_request])
        .then(function(res) {
          debtor_model = res[0];
          patient_model = res[1];


          patient.id = createId(patient_model.data);
          patient.debitor_id = createId(debtor_model.data);
          console.log("created p_id", patient.id);
          console.log("created id", patient.debitor_id);

          commit(patient);
        });
    }

    function commit(patient) {

      var debtor = $scope.debtor;
      patient_model = patient;

      var format_debtor = {id: patient_model.debitor_id, group_id: $scope.debtor.debtor_group.id};
      console.log("requesting debtor", format_debtor);
      //Create debitor record for patient - This SHOULD be done using an alpha numeric ID, like p12
      // FIXME 1 - default group_id, should be properly defined
      connect.basicPut("debitor", [format_debtor])
      .then(function(res) { 
        //Create patient record
        console.log("Debtor record added", res);
        connect.basicPut("patient", [patient_model])
        .then(function(res) {
          $location.path("patient_records/" + res.data.insertId);
          submitted = true;
        });
      });

    };

    $scope.formatLocation = function(l) { 
      return l.city + ", " + l.region;
    }

    $scope.checkChanged = function(model) { 
        return angular.equals(model, $scope.master);
    };

    $scope.checkSubmitted = function() { 
      return submitted;
    };

    function getGroups(){
      var req_db = {};
      req_db.e = [{t:'debitor_group', c:['id', 'name']}];
      req_db.c = [{t:'debitor_group', cl:'locked', z:'=', v:0}];
      kpkConnect.get('/data/?', req_db).then(function(data){
        $scope.debtor_group_model.data = data;
      });
      
    }

    $scope.createGroup = function () {
      var instance = $modal.open({
        templateUrl: "debtorgroupmodal.html",
        controller: function ($scope, $modalInstance) { //groupStore, accountModel
          console.log("Group module initialised");
          $scope.group = {};
          getAccounts();
          getLocations();
          getPayments();
          getTypes();
          function getAccounts(){
            var req_db = {};
            req_db.e = [{t:'account', c:['id', 'account_number','account_txt']}];
            req_db.c = [{t:'account', cl:'locked', z:'=', v:0, l:'AND'}, {t:'account', cl:'account_number', z:'>=', v:400000, l:'AND'}, {t:'account', cl:'account_number', z:'<', v:500000}];
            kpkConnect.get('/data/?', req_db).then(function(data){
              $scope.accounts = data;
            });
          }

          function getLocations(){
            var req_db = {};
            req_db.e = [{t:'location', c:['id', 'city', 'region']}];
            kpkConnect.get('/data/?', req_db).then(function(data){
            $scope.locations = data;
            });
          }

          function getPayments(){
            var req_db = {};
            req_db.e = [{t:'payment', c:['id', 'text']}];
            kpkConnect.get('/data/?', req_db).then(function(data){
            $scope.payments = data;
            });
          }

          function getTypes(){
            var req_db = {};
            req_db.e = [{t:'debitor_group_type', c:['id', 'type']}];
            kpkConnect.get('/data/?', req_db).then(function(data){
            $scope.types = data;
            });
          }

          $scope.submit = function(){
            $modalInstance.close($scope.group);
          }

          $scope.discard = function () {
            $modalInstance.dismiss();
          };
          /*var group = $scope.group = {},
            clean = {},
            cols = ["id", "name", "symbol", "sales_account", "cogs_account", "stock_account", "tax_account"];

          $scope.accounts = accountModel;

          $scope.submit = function () {
            group.id = groupStore.generateid();
            cols.forEach(function (c) { clean[c] = group[c]; }); // FIXME: AUGHGUGHA
            groupStore.put(group);
            connect.basicPut('inv_group', [clean]);
            $modalInstance.close();
          };*/

          

        },
        resolve: {
          //groupStore: function () { return stores.inv_group; },
          //accountModel: function () { return $scope.models.account; }
        }
      });
      instance.result.then(function(value) {
        //kpkConnect.send('creditor_group', [{id:'', group_txt:values.group, account_id:values.account.id}]);
        //getGroups();
        console.log(value);
        value.enterprise_id = appstate.get("enterprise").id;
        value.account_number = value.account_number.account_number;
        value.type_id = value.type_id.id;
        value.location_id = value.location_id.id;
        value.payment_id = value.payment_id.id;
        kpkConnect.send('debitor_group', [value]);
        getGroups();

    }, function() {
      console.log('dedrick');
    });
    }


    init();
  });