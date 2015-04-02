angular.module('bhima.controllers')
.controller('snis', [
  '$scope',
  '$q',
  '$translate',
  'validate',
  'messenger',
  'connect',
  'appstate',
  function ($scope, $q, $translate, validate, messenger, connect, appstate) {
    var dependencies = {};

    dependencies.reports = {
      query : '/snis/getAllReports'
    };

    validate.process(dependencies, ['reports'])
    .then(init);

    function init(model) {
      angular.extend($scope, model);
    }   
  }
]);
