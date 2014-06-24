angular.module('bhima.controllers')
.controller('employee', [
  '$scope',
  '$translate',
  'validate',
  'uuid',
  'messenger',
  'connect',
  function ($scope, $translate, validate, uuid, messenger, connect) {
    var dependencies = {}, session = $scope.session = {};
    var route = $scope.route = {
      create : 'EMPLOYEE.REGISTER',
      edit : 'EMPLOYEE.EDIT'
    };

    dependencies.employee = {
      query : {
        tables : {
          employee : { columns : ['id', 'name', 'code', 'creditor_uuid'] }
        }
      }
    };

    dependencies.creditorGroup = {
      query : {
        tables : {
          creditor_group : { columns : ['uuid', 'name', 'account_id', 'locked'] }
        }
      }
    };

    function initialise(model) {
      angular.extend($scope, model);
      // console.log(model.creditorGroup);
    }

    validate.process(dependencies)
    .then(initialise);

    function createEmployee() {
      session.state = route.create;
      session.employee = {};
      //console.log(session.state);
    }

    function registerEmployee() {
      var creditor_uuid = uuid();

      writeCreditor(creditor_uuid)
      .then(writeEmployee(creditor_uuid))
      .then(registerSuccess)
      .catch(handleError);
    }

    function writeCreditor(creditor_uuid) {
      var creditor = {
        uuid : creditor_uuid,
        group_uuid : session.creditor.group_uuid,
        text : 'Employee [' + session.employee.name + ']'
      };

      return connect.basicPut('creditor', [creditor], ['uuid']);
      // return deferred.promise;
    }

    function writeEmployee(creditor_uuid) {
      session.employee.creditor_uuid = creditor_uuid;
      return connect.basicPut('employee', [session.employee], ['uuid']);
      // return deferred.promise;
    }

    function registerSuccess() {
      session.employee = {};
      session.creditor = {};
      messenger.success($translate.instant('EMPLOYEE.REGISTER_SUCCESS'));

      // FIXME just add employee to model
      validate.refresh(dependencies, ['employee']).then(function (model) {
        angular.extend($scope, model);
      });
    }

    function handleError(error) {
      // TODO Error Handling
      messenger.danger($translate.instant('EMPLOYEE.REGISTER_FAIL'));
      throw error;
    }
    $scope.createEmployee = createEmployee;
    $scope.registerEmployee = registerEmployee;
  }
]);
