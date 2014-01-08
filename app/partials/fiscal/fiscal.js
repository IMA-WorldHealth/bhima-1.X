angular.module('kpk.controllers')
.controller('fiscalController', function($scope, $q, connect, appstate, messenger) { 
  $scope.active = "select";
  $scope.selected = null;
  $scope.new_model = {'year' : 'true'};
  
  var fiscal_set = false;

  function init() { 
    
    //Resposible for getting the current values of selects
    appstate.register("enterprise", function(res) { 
      loadEnterprise(res.id);

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
      var data = fiscal_model.data;
      if(!fiscal_set) appstate.set('fiscal', data[data.length -1]);
      if(data[0]) $scope.select(data[data.length - 1].id);
    });
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
    };
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
  };

  $scope.$watch('new_model.start', function(oval, nval) {
    if($scope.isFullYear()) updateEnd();
  });

  function updateEnd() {
    var s = $scope.new_model.start;
    if(s) {
//        Pretty gross
      var ds = new Date(s);
      var iterate = new Date(ds.getFullYear() + 1, ds.getMonth() - 1);
//        Correct format for HTML5 date element
      $scope.new_model.end = inputDate(iterate);
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
    var enterprise = $scope.enterprise;
    
    messenger.push({type: 'info', msg: 'Requesting Fiscal Year ' + model.start});
    connect.basicGet('/fiscal/' + enterprise.id + '/' + model.start + '/' + model.end + '/' + model.note)
    .then(function(res) { 
      
      //Reset model
      $scope.new_model = {'year':'true'};
      messenger.push({type: 'success', msg:'Fiscal Year generated successfully ' + model.start}); 

      //Reload fiscal years - could insert but unneeded calculation
      loadEnterprise(enterprise.id);
    }, function(err) { 
      messenger.push({type: 'danger', msg:'Fiscal Year request failed, server returned [' + err.data.code + ']'});
    });
  };

  function fetchPeriods(fiscal_id) {
    var period_query = {
      'tables' : {
        'period' : {
          'columns' : ["id", "period_start", "period_stop"]
        }
      },
      'where' : ['period.fiscal_year_id=' + fiscal_id]
    };
    connect.req(period_query).then(function(model) {
      $scope.period_model = model.data;
    });
  }


  function inputDate(date) {
    //Format the current date according to RFC3339 (for HTML input[type=="date"])
    return date.getFullYear() + "-" + ('0' + (date.getMonth() + 1)).slice(-2);
  }
  
  //Initialise after scope etc. has been set
  init();
});
