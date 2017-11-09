angular.module('bhima.controllers')
.controller('reportEmployeeStanding', [
  '$scope',
  '$window',
  'validate',
  'appstate',
  'messenger',
  'connect',
  function ($scope, $window, validate, appstate, messenger, connect) {
    var dependencies = {};
    $scope.img = 'placeholder.gif';
    var session = $scope.session = {},
      state = $scope.state;
    session.isSearched = false;
    session.noRecord = false;

    dependencies.employees = {
      required : true,
      query : {
        tables : {
          employee : {columns : ['id', 'code', 'prenom', 'name', 'postnom', 'sexe', 'dob', 'location_id','creditor_uuid','debitor_uuid', 'date_embauche']},
          debitor : { columns : ['text']},
          debitor_group : { columns : ['account_id', 'uuid']}
        },
        join : ['employee.debitor_uuid=debitor.uuid', 'debitor.group_uuid=debitor_group.uuid']
      }
    };

    dependencies.accounts = {
      required : true,
      query : {
        tables : {
          account : {
            columns : ['id', 'account_txt', 'account_number']
          }
        }
      }
    };

    $scope.formatPatient = function (employee) {
      return employee ? [employee.prenom, employee.name].join(' ') : '';
    };

    function processModels(models) {
      console.log('models;', models);
      angular.extend(session, models);
      session.date = new Date();
    }

    function handleErrors(err) {
      messenger.danger('An error occured:' + JSON.stringify(err));
    }

    function search() {
      $scope.state = 'generate';
      session.employee = session.selected;
      var id = session.employee.debitor_uuid;
      connect.fetch('/reports/employeeStanding/?id=' + id)
      .then(function (data) {

        session.receipts = data.receipts || [];
        session.employee.last_payment_date = new Date(data.last_payment_date);
        session.employee.last_purchase_date = new Date(data.last_purchase_date);

        var balance = 0,
            sumDue = 0,
            sumBilled = 0;

        session.receipts.forEach(function (receipt) {
          if (receipt.debit - receipt.credit !== 0){
            receipt.billed = receipt.debit;
            receipt.due = receipt.debit - receipt.credit;
            balance += receipt.debit - receipt.credit;
            sumBilled += receipt.billed;
            sumDue += receipt.due;
          }
        });

        session.employee.total_amount = sumBilled;
        session.employee.total_due = sumDue;
        session.employee.account_balance = balance;
        session.isSearched = true;
        session.noRecord = session.isSearched && !session.receipts.length;

      })
      .catch(function (err) {
        messenger.danger('An error occured:' + JSON.stringify(err));
      });
    }

    $scope.isOutstanding = function isoutstanding(receipt) {
      return receipt.debit - receipt.credit !== 0;
    };

    appstate.register('project', function (project) {
      $scope.project = project;

      validate.process(dependencies)
      .then(processModels, handleErrors);
    });

    $scope.print = function print() {
      window.print();
    };

    function reconfigure () {
      $scope.state = null;
      session.selected = null;
    }

    $scope.search = search;
    $scope.reconfigure = reconfigure;

  }
]);
