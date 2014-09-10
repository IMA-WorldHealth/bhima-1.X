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

  	//GET data from service ipr
  	ipr.start()
  	.then(formatting);
  	function formatting (obj){
  		session.ecarts = obj.ecarts;
	  	session.impots = obj.impots;
	  	session.cumuls = obj.cumuls;
	  	session.tranches = obj.tranches;
	  	//Formatage des donnees
	  	session.table_ipr = [];
	  	for(var i = 0 ; i < session.tranches.length ; i++){
	  		var item = {
	  			'taux':session.tranches[i].taux,
	  			'tranche_annuelle_debut':session.tranches[i].tranche_annuelle_debut,
	  			'tranche_annuelle_fin':session.tranches[i].tranche_annuelle_fin,
	  			'tranche_mensuelle_debut':session.tranches[i].tranche_mensuelle_debut,
	  			'tranche_mensuelle_fin':session.tranches[i].tranche_mensuelle_fin,
	  			'ecart_annuel':session.ecarts[i].ecart_annuel,
	  			'ecart_mois':session.ecarts[i].ecart_mois,
	  			'impot_annuel':session.impots[i].impot_annuel,
	  			'impot_mois':session.impots[i].impot_mois,
	  			'cumul_annuel':session.cumuls[i].cumul_annuel,
	  			'cumul_mois':session.cumuls[i].cumul_mois,
	  		};
	  		session.table_ipr.push(item);
	  	}
  	}//GET data from service ipr

  	//CRUD
  	var dependencies = {};
	dependencies.taxe_ipr = {
		query : {
			tables : {
				'taxe_ipr' : { columns : ['id','taux','tranche_annuelle_debut','tranche_annuelle_fin','tranche_mensuelle_debut','tranche_mensuelle_fin']}
			}
		}
	};

	function startup (models) {
      angular.extend($scope, models);
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
      });
    };

    function generateReference () {
      window.data = $scope.taxe_ipr.data;
      var max = Math.max.apply(Math.max, $scope.taxe_ipr.data.map(function (o) { return o.reference; }));
      return Number.isNaN(max) ? 1 : max + 1;
    }
  	//CRUD

  	$scope.tableau = function(){
  		session.show = 'tableau';
  	};

  	$scope.crud = function(){
  		session.show = 'crud';
  	}
  }

]);