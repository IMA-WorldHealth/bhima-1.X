angular.module('bhima.controllers')
.controller('taxes_management.ipr', [
  '$scope',
  'connect',
  'appstate',
  'messenger',
  'validate',
  'ipr',
  '$translate',
  function ($scope, connect, appstate, messenger, validate, ipr, $translate) {
  	var session = $scope.session = {};
  	var data = ipr.get();
  	session.ecarts = data.ecarts;
  	session.impots = data.impots;
  	session.cumuls = data.cumuls;
  	console.log('data',data);

  	//Formatage des donnees
  	session.table_ipr = {};
  	for(i = 0 ; i < session.ecarts.length ; i++){
  		var item = {
  			'taux':session.tranches[i].taux,
  			'tranche_annuelle_debut':session.tranches[i].tranche_annuelle_debut,
  			'tranche_annuelle_fin':session.tranches[i].tranche_annuelle_fin,
  			'tranche_mensuelle_debut':session.tranches[i].tranche_mensuelle_debut,
  			'tranche_mensuelle_fin':session.tranches[i].tranche_mensuelle_fin,
  			'ecart_annuel':session.ecarts[i].ecart_annuel,
  			'ecart_mois':session.ecarts[i].ecart_mois,
  			'impot_annuelle':session.impots[i].impot_annuel,
  			'impot_mois':session.impots[i].impot_mois,
  			'cumul_annuel':session.cumuls[i].cumul_annuel,
  			'cumul_mois':session.cumuls[i].cumul_mois,
  		};
  		session.table_ipr.push(item);
  		console.log(item);
  	}
  	console.log('table',session.table_ipr);
  }

]);