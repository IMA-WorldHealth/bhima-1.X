angular.module('kpk.controllers')
.controller('fiscalController', function($scope, $q, connect, appstate) { 
    $scope.active = "select";
    $scope.selected = null;
    $scope.create = false;

    $scope.new_model = {'year' : 'true'};

//    $scope.previous_fiscal

//   Temporary output vars
    var out_count = 0;
    var fiscal_set = false;

    function init() { 
      //Resposible for getting the current values of selects
      appstate.register("enterprise", function(res) { 
        loadEnterprise(res.id);
        console.log('fl e', res);
        //Reveal to scope for info display
        $scope.enterprise = res;
      });

      //This isn't required - should this be included?
      appstate.register("fiscal", function(res) { 
        console.log('fl f', res);
        fiscal_set = true;
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

      var period_ids = [];

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
          
          //MOVE ALL LOGIC TO SERVER FROM THIS POINT (AND LOOK AT PREVIOUS TO MOVE AS WELL)
          //res contains preiovusly inserted periods
          res.forEach(function(period) { 
            period_ids.push(period.data.insertId);
          });
          return generateBudget(period_ids);
        }).then(function(res) { 
          updateProgress("[Fiscal year and budget successfully configured]");
          fiscal_object.id = insertId;
          $scope.fiscal_model.post(fiscal_object);

          console.log('fiscal set', fiscal_set, fiscal_object);
          if(!fiscal_set) appstate.set('fiscal', fiscal_object);
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

    /////
    // Everything in these blocks should be done on the server - this is just a test for spamming HTTP requests
    // START
    /////
    function generateBudget(period_ids) { 
      var deferred = $q.defer();
      //allowed to be hacky because this will be done on the server
      getAccounts().then(function(res) { 
        var accounts = res.data;
        var periods = period_ids;

        console.time("HTTP");
        var budgetPromise = [];

        accounts.forEach(function(account) { 
          periods.forEach(function(period) { 
            budgetPromise.push(connect.basicPut('budget', [{account_id: account.id, period_id: period, budget: 0}]));
          })
        })

        $q.all(budgetPromise).then(function(res) { 
          console.log("All budgets written");
          deferred.resolve(res);
          console.timeEnd("HTTP");
        }, function(err) { 
          console.log("ERRRR", err);
        })
      });

      return deferred.promise;
    }

    function getAccounts() { 
      var deferred = $q.defer();

      var account_query = { 
        'tables' : {
          'account' : {
            'columns' : ["id"]
          }
        }
      }

      connect.req(account_query).then(function(res) { 
        deferred.resolve(res);
      })
      return deferred.promise;
    }

    /////
    // Everything in these blocks should be done on the server - this is just a test for spamming HTTP requests
    // STOP
    /////

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
