angular.module('kpk.controllers').controller('employee', 
[
  '$scope',
  'validate',
  function ($scope, validate) { 
    var dependencies = {}, session = $scope.session = {};
    var route = $scope.route = { 
      create : 'EMPLOYEE.REGISTER',
      edit : 'EMPLOYEE.EDIT'
    };
    
    dependencies.employee = { 
      query : { 
        tables : { 
          employee : { columns : ['id', 'creditor_uuid'] } 
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

    validate.process(dependencies).then(initialise);

    function initialise(model) { 
      angular.extend($scope, model);
    }

    function createEmployee() { 
      session.state = route.create;
      session.employee = {};
      console.log(session.state);
    }

    $scope.createEmployee = createEmployee;
  }
]);
