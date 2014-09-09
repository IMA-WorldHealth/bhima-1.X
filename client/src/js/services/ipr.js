angular.module('bhima.services')
.factory('ipr', ['validate', function(validate){
	//Summary:
	// Ce service effectue les calculs de l'IPR pour le Payroll
	var session = {};
		session.tranches = {};
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

	validate.process(dependencies)
	.then(setupModel)
	.then(generateEcartsImpots)
	.then(generateCumuls);

	function get(){
		return {
			ecarts    : session.ecarts,
			impots    : session.impots,
			cumuls    : session.cumuls,
			tranches  : session.tranches
		};
	}

	function setupModel(model){
		session.tranches = model.taxe_ipr.data;
		console.log(session);
	}

	function generateEcartsImpots(){
		var ecart_an, ecart_mois, impot_an, impot_mois;
		for (var tranche in session.tranches){
			ecart_an = session.tranches[tranche].tranche_annuelle_fin - session.tranches[tranche].tranche_annuelle_debut;
			ecart_mois = session.tranches[tranche].tranche_mensuelle_fin - session.tranches[tranche].tranche_mensuelle_debut;
			impot_an = ecart_an * (session.tranches[tranche].taux / 100);
			impot_mois = ecart_mois * (session.tranches[tranche].taux / 100);
			session.ecarts.push({'taux':session.tranches[tranche].taux,'ecart_annuel':ecart_an,'ecart_mois':ecart_mois});
			session.impots.push({'taux':session.tranches[tranche].taux,'impot_annuel':impot_an,'impot_mois':impot_mois});
		}
	}

	function generateCumuls(){
		var cum_an, cum_mois;
			session.cumuls.push({'taux':session.impots[0].taux,'cumul_annuel':0,'cumul_mois':0});
		for (i=1;i<session.impots.length;i++){
			cum_an = session.impots[i].impot_annuel + session.cumuls[i-1].cumul_annuel;
			cum_mois = session.impots[i].impot_mois + session.cumuls[i-1].cumul_mois;
			session.cumuls.push({'taux':session.impots[i].taux,'cumul_annuel':cum_an,'cumul_mois':cum_mois});
		}
	}

	return {
		get : get
	};
}]);