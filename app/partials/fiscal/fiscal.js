angular.module('kpk.controllers')
.controller('fiscalController', function($scope, $q, $modal, connect, appstate, messenger, validate) { 
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
      if(!fiscal_set && data[0]) fiscal_set = true; 
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
      console.log("RES IS:", res);

      var instance = $modal.open({
        templateUrl: 'createOpeningBalanceModal.html',
        keyboard : false,
        backdrop: 'static',
        controller : function ($scope, $modalInstance, fy_id, zero_id, enterprise) {
          $scope.fy_id = fy_id;
          connect.fetch({
            tables : {
              'account' : {
                columns : ['id', 'account_txt', 'account_number']
              },
              'account_type' : {
                columns : ['type']
              }
            },
            join : ['account.account_type_id=account_type.id'],
            where : ['account.enterprise_id='+enterprise.id]
          })
          .then(function (model) {

            model.forEach(function (row) {
              row.account_number = "" + row.account_number; // for sorting to work
            });

            $scope.accounts = model;
          });

          $scope.reset = function () {
            $scope.accounts.forEach(function (row) {
              row.credit = 0; 
              row.debit = 0;
            });
          };

          $scope.defaults = function () {
            $scope.accounts.forEach(function (row) {
              row.credit = Number((Math.random() * 10000).toFixed(2)); 
              row.debit = Number((Math.random() * 10000).toFixed(2));
            });
          };

          $scope.submit = function () {

            var data = $scope.accounts
            .filter(function (row) {
              return row.type != "title";
            })
            .map(function (row) {
              var o = {};
              o.account_id  = row.id;
              o.debit = row.debit || 0; // default to 0
              o.credit = row.credit || 0; // default to 0
              o.fiscal_year_id = fy_id;
              o.period_id = zero_id;
              o.enterprise_id = enterprise.id;
              return o;
            });
            
            connect.basicPut('period_total', [data])
            .then(function (res) {
              $modalInstance.close();
            }, function (err) {
              $modalInstance.dismiss(err);
            });
          };

        },
        resolve : {
          fy_id : function () {
            return res.data.fiscalInsertId;
          },
          zero_id : function () {
            return res.data.periodZeroId;
          },
          enterprise : function () {
            return $scope.enterprise;
          }
        }
      });

      instance.result.then(function () {
        //Reset model
        $scope.new_model = {'year':'true'};
        messenger.push({type: 'success', msg:'Fiscal Year generated successfully ' + model.start}); 
        
        if(!fiscal_set) appstate.set('fiscal', {id: res.data.fiscalInsertId, fiscal_year_txt: model.note});
        //Reload fiscal years - could insert but unneeded calculation
        loadEnterprise(enterprise.id);
      }, function (err) {
        messenger.danger('Error:' + JSON.stringify(err)); 
      });
    }, function(err) { 
      messenger.push({type: 'danger', msg:'Fiscal Year request failed, server returned [' + err.data.code + ']'});
    });
  };

  $scope.viewOpeningBalance =  function () {
    var id = $scope.selected.id;
    connect.fetch({
      tables : { 
        'period_total' : {
          columns : ['account_id', 'debit', 'credit', 'locked']
        },
        'period' : {
          columns : ['period_number']
        },
        'account' : {
          columns: ['account_txt', 'account_number']
        },
        'account_type' : {
          columns : ['type']
        }
      },
      join : ['period_total.account_id=account.id', 'period_total.period_id=period.id', 'account.account_type_id=account_type.id'],
      where : ['period_total.fiscal_year_id='+id, 'AND', 'period.period_number=0', 
        'AND', 'period_total.enterprise_id='+$scope.enterprise.id]
    })
    .then(function (res) {
      if (!res.length) 
        return messenger.warning('No opening balances found for fiscal year');

      var instance = $modal.open({
        templateUrl: 'viewOpeningBalanceModal.html',
        controller : function ($scope, $modalInstance, fiscal, accounts) {
          accounts.forEach(function (row) {
            row.account_number = "" + row.account_number;
          });
          $scope.accounts = accounts;
          $scope.fiscal = fiscal;
          $scope.dismiss = function () {
            $modalInstance.close();
          };
        },
        resolve : {
          accounts : function () {
            return res;
          },
          fiscal : function () {
            return $scope.selected; 
          }
        }
      });

      instance.result.then(function () {
        console.log('Modal closed');
      }, function () {
        console.log('Modal dismissed');
      });
  
      

    }, function (err) {
      messenger.danger('An error occured : ' + JSON.stringify(err));
    });
  };

  function fetchPeriods(fiscal_id) {
    var period_query = {
      'tables' : {
        'period' : {
          'columns' : ["id", "period_start", "period_stop"]
        }
      },
      'where' : ['period.fiscal_year_id=' + fiscal_id, 'AND', 'period.period_number<>0']
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
