angular.module('kpk.controllers').controller('fiscal', function($scope, $q, connect, appstate, messenger, validate) { 
  var dependencies = {};

  dependencies.fiscal = { 
    required: true, 
    query : {
      tables : {
        fiscal_year : {
          columns : ["id", "number_of_months", "fiscal_year_txt", "transaction_start_number", "transaction_stop_number", "start_month", "start_year", "previous_fiscal_year"]
        }
      }
    }
  };
  
  appstate.register('enterprise', buildFiscalQuery);

  function buildFiscalQuery(enterprise) { 
    var enterpriseId = $scope.enterpriseId = enterprise.id;
    dependencies.fiscal.where = ['fiscal_year.enterprise_id=' + enterpriseId];
    validate.process(dependencies).then(fiscal);
  }

  function fiscal(model) { 
    $scope.model = model;
  }
  
  $scope.active = "select";
  $scope.selected = null;
  $scope.new_model = {'year' : 'true'};
  
  var fiscal_set = false;

  $scope.select = function(fiscal_id) {
    if($scope.model.fiscal) { 
      fetchPeriods(fiscal_id);
      $scope.selected = $scope.model.fiscal.get(fiscal_id);
      $scope.active = "update";
    } 
  };

  $scope.delete = function(fiscal_id) { 
    //validate deletion before performing
    $scope.active = "select";
    $scope.selected = null;
    $scope.model.fiscal.delete(fiscal_id);
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
    
    messenger.push({type: 'info', msg: 'Requesting Fiscal Year ' + model.start});
    connect.basicGet('/fiscal/' + $scope.enterpriseId  + '/' + model.start + '/' + model.end + '/' + model.note)
    .then(function(res) { 
      
      //Reset model
      $scope.new_model = {'year':'true'};
      messenger.push({type: 'success', msg:'Fiscal Year generated successfully ' + model.start}); 
      
      if(!fiscal_set) appstate.set('fiscal', {id: res.data.fiscalInsertId, fiscal_year_txt: model.note});  
      //Reload fiscal years - could insert but unneeded calculation
      loadEnterprise($scope.enterpriseId);
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
});
