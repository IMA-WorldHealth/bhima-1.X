angular.module('bhima.services')
.service('ipr', ['validate', '$q', function(validate, $q){
	//Summary:
	// Ce service effectue les calculs de l'IPR pour le Payroll
	
	var session = {};
		session.tranches = [];
		session.ecarts = [];
		session.impots = [];
		session.cumuls = [];

	var dependencies = {};
	dependencies.taxe_ipr = {
		query : {
			tables : {
				'taxe_ipr' : { columns : ['taux','tranche_annuelle_debut','tranche_annuelle_fin','tranche_mensuelle_debut','tranche_mensuelle_fin']}
			}
		}
	};

	function setupModel(model){
		return $q.when(model.taxe_ipr.data);
	}

	function generateEcartsImpots(tranches){
		var ecart_an, ecart_mois, impot_an, impot_mois, ecarts = [], impots = [];
		session.tranches = tranches;
		for (var tranche in tranches){
			ecart_an = tranches[tranche].tranche_annuelle_fin - tranches[tranche].tranche_annuelle_debut;
			ecart_mois = tranches[tranche].tranche_mensuelle_fin - tranches[tranche].tranche_mensuelle_debut;
			impot_an = Math.round(ecart_an * (tranches[tranche].taux / 100));
			impot_mois = Math.round(ecart_mois * (tranches[tranche].taux / 100));
			ecarts.push({'taux':tranches[tranche].taux,'ecart_annuel':ecart_an,'ecart_mois':ecart_mois});
			impots.push({'taux':tranches[tranche].taux,'impot_annuel':impot_an,'impot_mois':impot_mois});
		}
		return $q.when({ecarts : ecarts, impots : impots});
	}

	function generateCumuls(obj){
		var cum_an, cum_mois;
		session.ecarts = obj.ecarts;
		session.impots = obj.impots;
		session.cumuls.push({'taux':session.impots[0].taux,'cumul_annuel':0,'cumul_mois':0});
		for (var i=1;i<session.impots.length;i++){
			cum_an = session.impots[i].impot_annuel + session.cumuls[i-1].cumul_annuel;
			cum_mois = session.impots[i].impot_mois + session.cumuls[i-1].cumul_mois;
			session.cumuls.push({'taux':session.impots[i].taux,'cumul_annuel':cum_an,'cumul_mois':cum_mois});
		}
		return $q.when();
	}

	function start () {
		var deff = $q.defer();
		validate.process(dependencies)
		.then(setupModel)
		.then(generateEcartsImpots)
		.then(generateCumuls)
		.then(function () {
			deff.resolve(session);
		});
		return deff.promise;
	}

	this.start = start;

}]);