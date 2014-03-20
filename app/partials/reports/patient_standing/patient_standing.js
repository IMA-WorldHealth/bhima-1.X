angular.module('kpk.controllers')
.controller('reportPatientStanding', [
  '$scope',
  'validate',
  'appstate',
  'messenger',
  'connect',
  function ($scope, validate, appstate, messenger, connect) {
    var dependencies = {};
    $scope.img = 'placeholder.gif';

    dependencies.patients = {
      required : true,
      query : {
        tables : {
          patient : {columns : ["uuid", "project_id", "reference", "debitor_uuid", "first_name", "last_name", "sex", "dob", "origin_location_id", "registration_date"]},
          debitor : { columns : ["text"]},
          debitor_group : { columns : ['account_id', 'price_list_uuid', 'is_convention']},
          project : { columns : ['abbr']}
        },
        join : ["patient.debitor_uuid=debitor.uuid", 'debitor.group_uuid=debitor_group.uuid', 'patient.project_id=project.id']
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

    $scope.formatPatient = function (patient) {
      return patient ? [patient.first_name, patient.last_name].join(' ') : '';
    };

    function processModels(models) {
      for (var k in models) { $scope[k]= models[k]; }

      $scope.date = new Date();
    }

    function handleErrors(err) {
      messenger.danger('An error occured:' + JSON.stringify(err));
    }

    $scope.search = function search() {
      $scope.patient = $scope.selection;
      var id = $scope.patient.debitor_uuid;
      connect.fetch('/reports/patientStanding/?id=' + id)
      .success(function (data) {
        $scope.receipts = data.receipts;

        $scope.patient.last_payment_date = new Date(data.last_payment_date);
        $scope.patient.last_purchase_date = new Date(data.last_purchase_date);

        var balance = 0,
            sumDue = 0,
            sumBilled = 0;
        $scope.receipts.forEach(function (receipt) {
          if (receipt.debit - receipt.credit === 0) { return; }
          receipt.billed = receipt.debit;
          receipt.due = receipt.debit - receipt.credit;
          balance += receipt.billed - receipt.due;
          sumBilled += receipt.billed;
          sumDue += receipt.due;
        });
        $scope.patient.total_amount = sumBilled;
        $scope.patient.total_due = sumDue;
        $scope.patient.account_balance = balance;
      })
      .error(function (err) {
        messenger.danger('An error occured:' + JSON.stringify(err));
      });
    };

    $scope.isOutstanding = function isoutstanding(receipt) {
      return receipt.debit - receipt.credit !== 0;
    };

    appstate.register('project', function (project) {
      $scope.project = project;

      validate.process(dependencies)
      .then(processModels, handleErrors);
    });

  }
]);
