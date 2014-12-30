angular.module('bhima.services')
.service('stockControl', ['validate', '$q', 'connect', function(validate, $q, connect){
	// Summary :
	// Ce service calcul les qte moyennes de consommation des inventories
	var dependencies = {},
		session = {};

	dependencies.consumptions = {
		query : {
			tables : {
				consumption : { columns : ['uuid','depot_uuid','date','quantity']},
				stock : { columns : ['inventory_uuid']}
			},
			join : ['consumption.tracking_number=stock.tracking_number']
		}
	};

	dependencies.nombreMois = {
		query : '/getNombreMoisStockControl/'
	};

	validate.process(dependencies);

	function getNombreMoisAVG (uuid) {
		// Nombre de mois pour AVG
		var deff = $q.defer();
		dependencies.consumptions.query.where = ['stock.inventory_uuid=' + uuid ];

		function calculMois (models) {
			var nb = models.nombreMois.data.nb;
			deff.resolve(nb);
		}

		return validate.refresh(dependencies)
			.then(calculMois)
			.then(function(){ return deff.promise; });
	}

	function consommationMensuelleSingle (uuid) {
		//Consommation mensuelle d'un seul inventory
		var deff = $q.defer();
		dependencies.consumptions.query.where = ['stock.inventory_uuid=' + uuid ];

		function calculCM (models) {
			var cons = models.consumptions.data;
			var nb = models.nombreMois.data.nb;
			var CM = 0;
			if(cons.length){
				cons.forEach(function (item) {
					CM += item.quantity;
				});
				if(nb > 0){ CM = CM / nb; }else{ CM = NaN; }
			}
			deff.resolve(CM);
		}

		return validate.refresh(dependencies)
			.then(calculCM)
			.then(function(){ return deff.promise; });
	}

	function getDelaiLivraison (uuid) {
		// Le delais de livraison 
		var deff = $q.defer();
		dependencies.delaiLivraison = {};
		dependencies.delaiLivraison.query = "/getDelaiLivraison/"+uuid;

		function calculDL (models) {
			var dl = models.delaiLivraison.data.dl;
			deff.resolve(dl);
		}

		return validate.refresh(dependencies)
			.then(calculDL)
			.then(function(){ return deff.promise; });
	}

	function getStockSecurity (uuid,dl) {
		// Le SS stock de securite
		var deff = $q.defer();
		var ss;

		if(dl){
			consommationMensuelleSingle(uuid)
			.then(function (cm) {
				ss = cm * dl;
				deff.resolve(ss);
			});
		}else {
			consommationMensuelleSingle(uuid)
			.then(function (cm) {
				var CM = cm;
				getDelaiLivraison(uuid)
				.then(function (dl){
					ss = CM * dl;
					deff.resolve(ss);
				});
			});
		}

		return deff.promise;
	}

	//Output
	this.consommationMensuelleSingle = consommationMensuelleSingle;
	this.getDelaiLivraison = getDelaiLivraison;
	this.getStockSecurity = getStockSecurity;
	this.getNombreMoisAVG = getNombreMoisAVG;
	
}]);