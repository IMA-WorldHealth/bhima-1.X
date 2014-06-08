angular.module('bhima.controllers')
.controller('fiscal', [
  '$scope',
  '$q',
  '$modal',
  'connect',
  'appstate',
  'messenger',
  'validate',
  function($scope, $q, $modal, connect, appstate, messenger, validate) {
    var dependencies = {};

    dependencies.fiscal = {
      // required: true,
      query : {
        tables : {
          fiscal_year : {
            columns : ["id", "number_of_months", "fiscal_year_txt", "transaction_start_number", "transaction_stop_number", "start_month", "start_year", "previous_fiscal_year"]
          }
        }
      }
    };

    //@sfount - remove variables on scope
    $scope.new_model = {'year' : 'true'};

    appstate.register('enterprise', buildFiscalQuery);

    function buildFiscalQuery(enterprise) {
      var enterpriseId = $scope.enterpriseId = enterprise.id;
      $scope.enterprise = enterprise;
      dependencies.fiscal.where = ['fiscal_year.enterprise_id=' + enterpriseId];
      validate.refresh(dependencies).then(fiscal);
    }

    function fiscal(model) {
      $scope.model = model;
    }

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
      if($scope.new_model.year === "true") return true;
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

      //messenger.push({type: 'info', msg: 'Requesting Fiscal Year ' + model.start});
      connect.fetch('/fiscal/' + $scope.enterpriseId  + '/' + model.start + '/' + model.end + '/' + model.note)
      .then(function(res) {

        var instance = $modal.open({
          templateUrl: 'createOpeningBalanceModal.html',
          keyboard : false,
          backdrop: 'static',
          controller : function ($scope, $modalInstance, fy_id, zero_id, enterprise) {
            $scope.enterprise = enterprise;
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
                row.debit = 0;
                row.credit = 0;
              });

              $scope.accounts = model;

            });

            $scope.reset = function () {
              $scope.accounts.forEach(function (row) {
                row.credit = 0;
                row.debit = 0;
              });
            };

            $scope.submit = function () {

              var data = $scope.accounts
              .filter(function (row) {
                return row.type !== "title";
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

              connect.basicPut('period_total', data)
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
          //messenger.push({type: 'success', msg:'Fiscal Year generated successfully ' + model.start});

          // if(!fiscal_set) appstate.set('fiscal', {id: res.data.fiscalInsertId, fiscal_year_txt: model.note});

          //TODO Hack
          buildFiscalQuery({id: $scope.enterpriseId});
          $scope.active = "select";
        }, function (err) {
          messenger.danger('Error:' + JSON.stringify(err));
        });
      }, function(err) {
        //messenger.push({type: 'danger', msg:'Fiscal Year request failed, server returned [' + err.data.code + ']'});
      });
    };

    $scope.viewOpeningBalance =  function () {
      console.log('nous sommes la ');
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
          'AND', 'period_total.enterprise_id='+$scope.enterpriseId]
      })
      .then(function (res) {
        if (!res.length)
          return messenger.danger('No opening balances found for fiscal year');

        var instance = $modal.open({
          templateUrl: 'viewOpeningBalanceModal.html',
          controller : function ($scope, $modalInstance, fiscal, accounts, enterprise) {
            $scope.enterprise = enterprise;
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
            },
            enterprise : function () {
              return $scope.enterprise;
            }
          }
        });

        instance.result.then(function () {
        }, function () {
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
  }
]);
