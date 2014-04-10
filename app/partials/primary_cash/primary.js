angular.module('kpk.controllers')
.controller('primaryCash', [
  '$scope',
  'validate',
  function ($scope, validate) { 
    var dependencies = {}, session = $scope.session = {};
    var configuration = $scope.configuration = {};

    dependencies.cashBox = { 
      query : { 
        tables : { 
          cash_box : { columns : ['id', 'text', 'project_id', 'is_auxillary'] }
        },
        where : ['cash_box.is_auxillary=0']
      }
    };

    configuration.income = [
      {
        key : 'PURCHASE',
        link : '/primary_cash/income/purchase/'
      }
    ];

    configuration.expense = [
      {
        key : 'GENERIC_EXPENSE',
        link : '/primary_cash/expense/generic/'
      }
    ];
     
    validate.process(dependencies).then(initialise);

    function initialise(model) { 
      angular.extend($scope, model);
      
      session.cashbox = model.cashBox.data[0].id;
    }

  }
]);
