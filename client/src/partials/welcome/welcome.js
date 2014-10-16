angular.module('bhima.controllers')
.controller('welcome', [
  '$scope',
  'validate',
  function ($scope, validate) {
    var dependencies = {};

    dependencies.unit = {
      query : '/tree'
    };

    validate.process(dependencies)
    .then(startup);

    function startup (models) {
      angular.extend($scope, models);
    }

  }
]);
