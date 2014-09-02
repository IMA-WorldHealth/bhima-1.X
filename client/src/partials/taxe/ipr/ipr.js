angular.module('bhima.controllers')
.controller('taxes_management.ipr', [
  '$scope',
  'connect',
  'appstate',
  'messenger',
  'validate',
  'ipr',
  '$translate',
  '$q',
  '$modal',
  function ($scope, connect, appstate, messenger, validate, ipr, $translate, $q, $modal) {
  	var session = $scope.session = {};
  	session.show = 'crud';
  	session.view = $translate.instant('TAXES.SEE_TABLE');

  	var dependencies = {};
	dependencies.taxe_ipr = {
		query : '/taxe_ipr_currency/'
	};

  dependencies.currency = {
    query : {
      tables : {
        'currency' : { columns : ['id','symbol']}
      }
    }
  };

	function startup (models) {
      angular.extend($scope, models);
      loadIprData(models.taxe_ipr.data);
    }

    function loadIprData(data){
    	ipr.calculate()
	    .then(function(data){
	    	session.table_ipr = data;
	    });
    }

	appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      validate.process(dependencies)
      .then(startup);
    });

    $scope.delete = function (taxe_ipr) {
      var result = confirm($translate.instant('TAXES.CONFIRM'));
      if (result) {  
        connect.basicDelete('taxe_ipr', taxe_ipr.id, 'id')
        .then(function () {
          $scope.taxe_ipr.remove(taxe_ipr.id);
          messenger.info($translate.instant('TAXES.DELETE_SUCCESS'));
          session.edit = {};
          session.new = {};
        });
      }
    };

    $scope.edit = function (taxe_ipr) {
      session.action = 'edit';
      session.edit = angular.copy(taxe_ipr);
    };

    $scope.new = function () {
      session.action = 'new';
      session.new = {};
      session.show = 'crud';
    };

    $scope.save = {};

    $scope.save.edit = function () {
      session.edit.tranche_mensuelle_debut = session.edit.tranche_annuelle_debut / 12;
      session.edit.tranche_mensuelle_fin = session.edit.tranche_annuelle_fin / 12;

      var record = connect.clean(session.edit);
      delete record.reference;
      connect.basicPost('taxe_ipr', [record], ['id'])
      .then(function () {
        messenger.success($translate.instant('TAXES.UPDATE_SUCCES')); 
        $scope.taxe_ipr.put(record);
        session.action = '';
        session.edit = {};
        
        validate.refresh(dependencies)
      	.then(startup);

      });
    };

    $scope.save.new = function () {
      session.new.tranche_mensuelle_debut = session.new.tranche_annuelle_debut / 12;
      session.new.tranche_mensuelle_fin = session.new.tranche_annuelle_fin / 12;

      var record = connect.clean(session.new);
      connect.basicPut('taxe_ipr', [record])
      .then(function () {
        messenger.success($translate.instant('TAXES.SAVE_SUCCES'));
        record.reference = generateReference();
        $scope.taxe_ipr.post(record);
        session.action = '';
        session.new = {};
        
        validate.refresh(dependencies)
      	.then(startup);
        
      });
    };

    function generateReference () {
      window.data = $scope.taxe_ipr.data;
      var max = Math.max.apply(Math.max, $scope.taxe_ipr.data.map(function (o) { return o.reference; }));
      return Number.isNaN(max) ? 1 : max + 1;
    }

  	$scope.toggleView = function(){
  		if(session.show == 'tableau'){
  			session.show = 'crud';
  			session.view = $translate.instant('TAXES.SEE_TABLE');
  		}
  		else if(session.show == 'crud'){
  			session.show = 'tableau';
  			session.view = $translate.instant('TAXES.TOGGLE_VIEW');
  		}
  	};
  }

]);