angular.module('bhima.controllers')
.controller('group.debtor', [
  '$scope',
  '$translate',
  'connect',
  'appstate',
  'validate',
  'uuid',
  'messenger',
  function ($scope, $translate, connect, appstate, validate, uuid, messenger) {
    var dependencies = {};
    $scope.data = {};

    dependencies.debitor_group = {
      query : {
        identifier : 'uuid',
        tables : {
          'debitor_group' : {
            columns : ['uuid', 'name', 'account_id', 'location_id', 'phone', 'email', 'note', 'locked', 'max_credit', 'is_convention', 'price_list_uuid']
          }
        }
      }
    };

    dependencies.account = {
      required : true,
      query : {
        tables : {
          'account' : {
            columns : ['id', 'account_number', 'account_txt', 'account_type_id']
          }
        }
      }
    };

    dependencies.price_list = {
      query : {
        tables : {
          'price_list' : {
            columns: ['enterprise_id', 'uuid', 'title', 'description']
          }
        }
      }
    };

    dependencies.location = {
      query : '/location/villages'
    };

    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      dependencies.debitor_group.query.where =
        ['debitor_group.enterprise_id=' + enterprise.id];
      dependencies.price_list.query.where =
        ['price_list.enterprise_id=' + enterprise.id];
      dependencies.account.query.where =
        ['account.locked<>1', 'AND', 'account.enterprise_id=' + enterprise.id, 'AND', 'account.is_ohada=1'];
      validate.process(dependencies)
      .then(setUpModels);
    });

    function setUpModels (models) {
      angular.extend($scope, models);
      $scope.account.data.forEach(function (account) {
        account.account_number = String(account.account_number);
      });
      $scope.action = '';
    }

    $scope.formatAccount = function formatAccount(account) {
      return [account.account_number, account.account_txt].join(' :: ');
    };

    $scope.formatLocation = function formatLocation(l) {
      return [l.name, l.sector_name, l.province_name, l.country_name].join(', ');
    };

    $scope.formatPriceList = function formatPriceList(pl) {
      return pl.title;
    };

    $scope.new = function () {
      $scope.newGroup = {};
      $scope.action = 'new';
    };

    $scope.edit = function (group) {
      $scope.editGroup = angular.copy(group);
      $scope.edit_original = group;
      $scope.action = 'edit';
    };

    $scope.lock = function (group) {
      connect.basicPost('debitor_group', [{uuid: group.uuid, locked: group.locked}], ['uuid']);
    };

    $scope.submitNew = function () {
      $scope.newGroup.enterprise_id = $scope.enterprise.id;
      $scope.newGroup.uuid = uuid();
      var data = connect.clean($scope.newGroup);
      connect.basicPut('debitor_group', [data])
      .then(function (res) {
        data.id = res.data.insertId;
        $scope.debitor_group.post(data);
        $scope.action = '';
        messenger.success($translate.instant('DEBITOR_GRP.SUCCES'));
      });
    };

    $scope.resetNew = function () {
      $scope.newGroup = {};
    };

    $scope.submitEdit =  function () {
      var data = connect.clean($scope.editGroup);
      if(!$scope.editGroup.price_list_uuid){
        data.price_list_uuid = null;
      }         

      connect.basicPost('debitor_group', [data], ['uuid'])
      .then(function () {
        $scope.debitor_group.put(data);
        $scope.action = '';
        $scope.editGroup = {}; // reset
        messenger.success($translate.instant('DEBITOR_GRP.SUCCES'));
      });
    };

    $scope.resetEdit = function () {
      $scope.editGroup = angular.copy($scope.edit_original);
    };
  }
]);
