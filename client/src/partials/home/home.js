angular.module('bhima.controllers')
.controller('home', [
  '$scope',
  '$translate',
  'appstate',
  'validate',
  'exchange',
  function ($scope, $translate, appstate, validate, exchange) {
  	var session = $scope.session = {},
  			dependencies = {};

  	dependencies.register = {
      query : 'user_session'
    };

    function init (model) {
    	angular.extend($scope, model);
    	session.date = new Date();
      session.hasDailyRate = exchange.hasDailyRate();
    	session.exchangeRate = session.hasDailyRate ? '1 $ = ' + exchange.rate(100, 1, session.date) + ' Fc' : $translate.instant('HOME.UNDEFINED');
    	handleUserInfo();
    }

    function handleUserInfo () {
    	session.user = $scope.user.data[0];
    }

    function treePermission (model) {
      dependencies.user = {
        query : {
          tables : {
            user : { columns : ['first', 'last'] }
          },
          where : ['user.id=' + model.register.data.id]
        }
      };
	    validate.process(dependencies, ['user'])
	    .then(init);
    }

    appstate.register('project', function (project) {
      $scope.project = project;
      validate.process(dependencies, ['register'])
      .then(treePermission);
    });

  }
]);
