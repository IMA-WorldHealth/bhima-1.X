angular.module('bhima.controllers')
.controller('fiscal', [
  '$scope',
  '$modal',
  'connect',
  'appstate',
  'messenger',
  'validate',
  function($scope, $modal, connect, appstate, messenger, validate) {
    var dependencies = {};

    dependencies.fiscal = {
      // required: true,
      query : {
        tables : {
          fiscal_year : {
            columns : ['id', 'number_of_months', 'fiscal_year_txt', 'transaction_start_number', 'transaction_stop_number', 'start_month', 'start_year', 'previous_fiscal_year']
          }
        }
      }
    };

    $scope.newModel = {'year' : 'true'};

    appstate.register('enterprise', buildFiscalQuery);

    function buildFiscalQuery(enterprise) {
      var enterpriseId = $scope.enterpriseId = enterprise.id;
      $scope.enterprise = enterprise;
      dependencies.fiscal.where = ['fiscal_year.enterprise_id=' + enterpriseId];
      validate.refresh(dependencies)
      .then(fiscal);
    }

    function fiscal(model) {
      $scope.model = model;
    }

    $scope.select = function(fiscalId) {
      if ($scope.model.fiscal) {
        fetchPeriods(fiscalId);
        $scope.selected = $scope.model.fiscal.get(fiscalId);
        $scope.active = 'update';
      }
    };

    $scope.delete = function(fiscalId) {
      //validate deletion before performing
      $scope.active = 'select';
      $scope.selected = null;
      $scope.model.fiscal.delete(fiscalId);
    };

    $scope.isSelected = function() {
      return !!$scope.selected;
    };

    $scope.isFullYear = function() {
      return $scope.newModel.year === 'true';
    };

    $scope.$watch('newModel.start', function() {
    });

    $scope.createFiscal = function createFiscal() {
      //Do some session checking to see if any values need to be saved/ flushed to server
      $scope.active = 'create';
      $scope.selected = null;
    };

    $scope.getFiscalStart = function getFiscalStart() {
      if ($scope.periodModel && $scope.periodModel[0]) {
        return $scope.periodModel[0].period_start;
      }
    };

    $scope.getFiscalEnd = function() {
      if ($scope.periodModel) {
        var l = $scope.periodModel;
        var t = l[l.length-1];
        if (t) {
          return t.period_stop;
        }
      }
    };
    
    $scope.updateDates = function updateDates () {
      if ($scope.isFullYear()) {
        var start = $scope.newModel.start;
        if (start) {
          var ds = new Date(start);
          var iterate = new Date(ds.getFullYear() + 1, ds.getMonth() - 1);
          $scope.newModel.end = iterate;
        }
      }
    };

    $scope.generateFiscal = function generateFiscal() {
      var model = $scope.newModel;
      //messenger.push({type: 'info', msg: 'Requesting Fiscal Year ' + model.start});
      connect.fetch('/fiscal/' + $scope.enterpriseId  + '/' + Number(model.start) + '/' + Number(model.end) + '/' + model.description)
      .then(function (res) {

        var instance = $modal.open({
          templateUrl: 'createOpeningBalanceModal.html',
          keyboard : false,
          backdrop: 'static',
          controller : ['$scope', '$modalInstance', 'fiscalYearId', 'zeroId', 'enterprise', function ($scope, $modalInstance, fiscalYearId, zeroId, enterprise) {
            $scope.enterprise = enterprise;
            $scope.fiscalYearId = fiscalYearId;
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
                row.account_number = '' + row.account_number; // for sorting to work
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
                return row.type !== 'title';
              })
              .map(function (row) {
                return {
                  account_id     : row.id,
                  debit          : row.debit || 0, // default to 0
                  credit         : row.credit || 0, // default to 0
                  fiscal_year_id : fiscalYearId,
                  period_id      : zeroId,
                  enterprise_id  : enterprise.id,
                };
              });

              connect.basicPut('period_total', data)
              .then(function () {
                $modalInstance.close();
              })
              .catch(function (err) {
                $modalInstance.dismiss(err);
              })
              .finally();
            };
          }],

          resolve : {
            fiscalYearId : function () {
              return res.fiscalInsertId;
            },
            zeroId : function () {
              return res.periodZeroId;
            },
            enterprise : function () {
              return $scope.enterprise;
            }
          }
        });

        instance.result.then(function () {
          //Reset model
          $scope.newModel = {'year':'true'};
          //messenger.push({type: 'success', msg:'Fiscal Year generated successfully ' + model.start});

          //TODO Hack
          buildFiscalQuery({id: $scope.enterpriseId});
          $scope.active = 'select';
        }, function (err) {
          messenger.danger('Error:' + JSON.stringify(err));
        });
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
        join : [
          'period_total.account_id=account.id',
          'period_total.period_id=period.id',
          'account.account_type_id=account_type.id'
        ],
        where : [
          'period_total.fiscal_year_id=' + id,
          'AND', 'period.period_number=0',
          'AND', 'period_total.enterprise_id=' + $scope.enterpriseId
        ]
      })
      .then(function (res) {
        if (!res.length) {
          return messenger.danger('No opening balances found for fiscal year');
        }

        $modal.open({
          templateUrl: 'viewOpeningBalanceModal.html',
          keyboard : false,
          backdrop: 'static',
          controller : ['$scope', '$modalInstance', 'fiscal', 'accounts', 'enterprise', function ($scope, $modalInstance, fiscal, accounts, enterprise) {
            $scope.enterprise = enterprise;
            accounts.forEach(function (row) {
              row.account_number = '' + row.account_number;
            });
            $scope.accounts = accounts;
            $scope.fiscal = fiscal;
            $scope.dismiss = function () {
              $modalInstance.close();
            };
          }],
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

      }, function (err) {
        messenger.danger('An error occured : ' + JSON.stringify(err));
      });
    };

    function fetchPeriods(fiscalId) {
      var periodSql = {
        tables : {
          period : {
            columns : ['id', 'period_start', 'period_stop']
          }
        },
        where : [
          'period.fiscal_year_id=' + fiscalId,
          'AND', 'period.period_number<>0'
        ]
      };

      connect.req(periodSql)
      .then(function (model) {
        $scope.periodModel = model.data;
      });
    }
  }
]);
