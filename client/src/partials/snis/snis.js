angular.module('bhima.controllers')
.controller('snis', [
  '$scope',
  '$q',
  '$translate',
  '$http',
  '$location',
  'validate',
  'messenger',
  'connect',
  'appstate',
  function ($scope, $q, $translate, $http, $location, validate, messenger, connect, appstate) {
    var dependencies = {};

    dependencies.reports = {
      query : '/snis/getAllReports'
    };

    validate.process(dependencies, ['reports'])
    .then(init);

    function init(model) {
      angular.extend($scope, model);
    }

    $scope.print = function (obj) {

    };

    $scope.edit = function (obj) {
      $location.path('/snis/edit_report/' + obj.id);
    };

    $scope.delete = function (obj) {
      $http.delete('/snis/deleteReport/' + obj.id)
      .success(function (res) {
        validate.refresh(dependencies, ['reports'])
        .then(init)
        .then(function () {
          messenger.success('[succes] Rapport supprime avec succes', true);
        });
      });
    };
  }
]);
