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
          employee : { columns : ['id', 'name', 'code', 'creditor_uuid', 'dob', 'prenom', 'postnom', 'sexe', 'nb_spouse', 'nb_enfant', 'date_embauche', 'grade_id', 'daily_salary', 'bank', 'bank_account', 'phone', 'email', 'adresse'] },
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

    //================ BEGIN CODE BRUCE =======================//
    dependencies.services = {
      query : {
        tables : {
          service : { columns : ['id','name']},
          project : { columns : ['abbr']}
        },
        join : ['service.project_id=project.id']
      }
    };

    var initServiceProject = function(){
      $scope.dataServices = $scope.services.data;
    };

    //==================LOCATION====================//
    dependencies.location = {
      query : '/location/'
    };
    
    $scope.formatLocation = function formatLocation (location) {
      return [location.village, location.sector, location.province, location.country].join(', ');
    };
    //==================LOCATION====================//

    //==================GRADE=======================//
    dependencies.grade = {
      query : {
        tables : {
          grade : { columns : ['uuid', 'code', 'text']}
        }
      }
    };

    $scope.formatGrade = function formatGrade (grade) {
      return grade.code + " - " + grade.text;
    };
    //==================GRADE=======================//

    //==================DEBTOR======================//
    dependencies.debtorGroup = {
      query : {
        tables : {
          debitor_group : { columns : ['uuid', 'name'] }
        }
      }
    };

    function writeDebitor(debitor_uuid) {
      var debitor = {
        uuid : debitor_uuid,
        group_uuid : session.employee.debitor_uuid,
        text : 'Employee [' + session.employee.name + ']'
      };

      return connect.basicPut('debitor', [debitor], ['uuid']);
    }
    //==================DEBTOR======================//

    //================= END CODE BRUCE ========================//

    function initialise(model) {
      angular.extend($scope, model);
    }
      
    validate.process(dependencies)
    .then(initialise)
    .then(initServiceProject);
    
    function transitionRegister() { 
      session.state = route.create;
      session.employee = {};
    }

    function registerEmployee() {
      var creditor_uuid = uuid();
      var debitor_uuid = uuid();//Code Bruce

      writeCreditor(creditor_uuid)
      .then(writeDebitor(debitor_uuid))
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
      //BRUCE 
      console.log(employee);
      //BRUCE
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
