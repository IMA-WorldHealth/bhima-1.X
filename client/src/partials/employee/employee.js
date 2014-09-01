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
      create : { 
        title : 'EMPLOYEE.REGISTER',
        submit : 'EMPLOYEE.SUBMIT_NEW',
        method : registerEmployee
      },
      edit : {
        title : 'EMPLOYEE.EDIT',
        submit : 'EMPLOYEE.SUBMIT_EDIT',
        method : updateEmployee
      }
    };

    dependencies.employee = {
      query : {
        tables : {
          employee : { columns : ['id', 'name', 'code', 'creditor_uuid', 'dob'] },
          creditor : { columns : ['group_uuid'] }
        },
        join : ['employee.creditor_uuid=creditor.uuid']
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
    }
      
    validate.process(dependencies)
    .then(initialise);
    
    function transitionRegister() { 
      session.state = route.create;
      session.employee = {};
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
        group_uuid : session.employee.group_uuid,
        text : 'Employee [' + session.employee.name + ']'
      };

      return connect.basicPut('creditor', [creditor], ['uuid']);
    }

    function writeEmployee(creditor_uuid) {
      session.employee.creditor_uuid = creditor_uuid;
      
      // FIXME
      delete(session.employee.group_uuid);
      return connect.basicPut('employee', [session.employee], ['uuid']);
    }

    function registerSuccess() {
      session.employee = {};
      session.creditor = {};
      messenger.success($translate.instant('EMPLOYEE.REGISTER_SUCCESS'));

      // FIXME just add employee to model
      validate.refresh(dependencies, ['employee']).then(function (model) {
        angular.extend($scope, model);
        session.state = null;
      });
    }

    function editEmployee(employee) { 
      session.employee = employee;
      session.state = route.edit;
    }

    function updateEmployee() { 
      var creditor = {
        uuid : session.employee.creditor_uuid,
        group_uuid : session.employee.group_uuid
      };
      var employee = session.employee;
      
      delete(employee.group_uuid);
      
      submitCreditorEdit(creditor)
      .then(submitEmployeeEdit(employee))
      .then(function (result) { 
        session.state = null;
        session.employee = {};
      })
      .catch(handleError);
    }

    function submitCreditorEdit(creditor) { 
      return connect.basicPost('creditor', [creditor], ['uuid']);
    }

    function submitEmployeeEdit(employee) {
      return connect.basicPost('employee', [employee], ['id']);
    }

    function handleError(error) {
      
      // TODO Error Handling
      messenger.danger($translate.instant('EMPLOYEE.REGISTER_FAIL'));
      throw error;
    }
    
    $scope.registerEmployee = registerEmployee;
    $scope.editEmployee = editEmployee;
    $scope.transitionRegister = transitionRegister;
  }
]);
