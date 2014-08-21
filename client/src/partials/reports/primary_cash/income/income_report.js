angular.module('bhima.controllers')
.controller('primary_cash.incomeReport', [
  '$scope',
  '$q',
  'connect',
  'appstate',
  'validate',
  'messenger',
  'util',
  'appcache',
  function ($scope, $q, connect, appstate, validate, messenger, util, Appcache) {
    var session = $scope.session = {};
    var dependencies = {};
    var cache = new Appcache('income_report');
    session.dateFrom = new Date();
    session.dateTo = new Date();

    dependencies.cashes = {
      required: true,
      query : {
        tables : {
          'cash_box' : {
            columns : ['text', 'project_id']
          },
          'cash_box_account_currency' : {
            columns : ['id', 'currency_id', 'cash_box_id', 'account_id']
          },
          'currency' : {
            columns : ['symbol']
          }
        },
        join : ['cash_box.id=cash_box_account_currency.cash_box_id', 'currency.id=cash_box_account_currency.currency_id' ]
      }
    };
    dependencies.records = {};    

    cache.fetch('selectedCash').then(load);

    function load (selectedCash) {
      if (selectedCash) { session.selectedCash = selectedCash; }
      
      appstate.register('project', function(project) {
        session.project = project;
        dependencies.cashes.query.where = ['cash_box.project_id=' + project.id, 'AND', 'cash_box.is_auxillary=0'];
        validate.process(dependencies, ['cashes'])
        .then(init)
        .catch(function (err) {
          messenger.danger(err.toString());
        });
      });
    }

    function init (model) {
      $scope.session.model = model;
      if(session.selectedCash){
        fill();
      }
    }

    function setSelectedCash (obj) {
      session.selectedCash = obj;
      cache.put('selectedCash', obj);
      fill();
    }

    function fill () {
      var request;

      request = {
        dateFrom : util.sqlDate(session.dateFrom),
        dateTo : util.sqlDate(session.dateTo),
        account_id : session.selectedCash.account_id
      };

      dependencies.records.query = '/reports/income_report/?' + JSON.stringify(request);      
      validate.refresh(dependencies, ['records'])
      .then(prepareReport)
      .catch(function (err) {
       messenger.danger(err.toString());

      });
    }

    function prepareReport (model) {
      session.model = model;
    }

    $scope.setSelectedCash = setSelectedCash;
    $scope.fill = fill;
  }
]);
