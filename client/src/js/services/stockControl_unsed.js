angular.module('bhima.services')
.service('stockControl', ['validate', '$q', 'connect','util', function (validate, $q, connect, util){
	// Summary :
	// Ce service calcul les qte moyennes de consommation des inventories
	// A FAIRE : des simulations concretes pour DL
	// A FAIRE : des simulations concretes pour IC
	// A FAIRE : gerer les cas de valeur null
	
	var dependencies = {},
		inventory = {};

	dependencies.stock = {
		query : {
			tables : {
				stock : {columns : ['quantity']}
			}
		}
	};

	validate.process(dependencies);

	function getNombreMoisAVG (uuid) {
		// Nombre de mois pour AVG
		var deff = $q.defer();
		dependencies.nombreMois = {};
		dependencies.nombreMois.query = '/getNombreMoisStockControl/'+uuid;

		function calculMois (models) {
			var nb = models.nombreMois.data.nb;

			if(nb > 6) {
				nb = 6;
			}
			
			inventory.nb = nb;
			deff.resolve(nb);
		}

		return validate.refresh(dependencies)
			.then(calculMois)
			.then(function(){ return deff.promise; });
	}

	function getMonthlyConsumption (uuid,nb_month) {
		//Consommation mensuelle d'un seul inventory
		var deff = $q.defer();

		dependencies.consumptions = {};
		dependencies.consumptions.query = '/monthlyConsumptions/' + uuid + '/' + nb_month;

		dependencies.allConsumptions = {
			query : {
				tables : {
					consumption : { columns : ['quantity']},
					stock : { columns : ['inventory_uuid']}
				},
				join : ['consumption.tracking_number=stock.tracking_number'],
				where : ['stock.inventory_uuid=' + uuid ]
			}
		};

		dependencies.stock.query.where = ['stock.inventory_uuid=' + uuid ];

		function calculCM (models) {
			if(models.stock.data.length > 0){
				var stock_status = models.stock.data;
				var cons = models.consumptions.data;
				var allCons = models.allConsumptions.data;
				var consumptions = 0;
				var nb = nb_month;
				var CM = 0;
				var stock_init = 0;
				var stock = 0;

				if(stock_status.length){
					stock_status.forEach(function (item) {
						stock_init += item.quantity;
					});
				}

				if(allCons.length){
					allCons.forEach(function (item) {
						consumptions += item.quantity;
					});
				}

				if(cons.length){
					cons.forEach(function (item) {
						CM += item.quantity; 
					});
					if(nb > 0){ CM = CM / nb; }else{ CM = 0; }
				}

				stock = stock_init - consumptions;
				inventory.stock_init = stock_init;
				inventory.stock = stock;
				inventory.cm = CM;
				deff.resolve(CM);
			}
		}

		return validate.refresh(dependencies)
			.then(calculCM)
			.then(function(){ return deff.promise; });
	}

	function getDelaiLivraison (uuid,default_dl) {
		// Le delais de livraison 
		var deff = $q.defer();
		dependencies.delaiLivraison = {};
		dependencies.delaiLivraison.query = '/getDelaiLivraison/'+uuid;

		function calculDL (models) {
			if(default_dl){
				inventory.dl = default_dl;
				deff.resolve(default_dl);
			}else{
				var dl = models.delaiLivraison.data.dl;
				inventory.dl = dl;
				deff.resolve(dl);
			}
			
		}

		return validate.refresh(dependencies)
			.then(calculDL)
			.then(function(){ return deff.promise; });
	}

	function getIntervalleCommande (uuid,default_ic) {
		// Intervalle de commande
		var deff = $q.defer();
		dependencies.commandes = {};
		dependencies.commandes.query = '/getCommandes/'+uuid;

		function calculIC (models) {
			if(default_ic){
				inventory.ic = default_ic;
				deff.resolve(default_ic);
			}else {
				var commandes = models.commandes.data;
				var dates = [];

				commandes.forEach(function (item) {
					dates.push(new Date(item.date_commande));
				});

				var sMonth = 0;
				var sAvg = 0;

				if(dates.length > 1){ 
					for(var i = 1 ; i < dates.length ; i++){
						sMonth += DateDiff.inMonths(dates[i],dates[i-1]);
					}
					sAvg = sMonth / (dates.length - 1);
				}
				else if(dates.length == 1){ sAvg = sMonth; }
				else { sAvg = 0; }

				inventory.ic = sAvg;
				deff.resolve(sAvg);
			}
			
		}

		var DateDiff = {
		    inDays: function(d1, d2) {
		        var t2 = d2.getTime();
		        var t1 = d1.getTime();
		        return parseInt((t2-t1)/(24*3600*1000));
		    },
		    inWeeks: function(d1, d2) {
		        var t2 = d2.getTime();
		        var t1 = d1.getTime();

		        return parseInt((t2-t1)/(24*3600*1000*7));
		    },
		    inMonths: function(d1, d2) {
		        var d1Y = d1.getFullYear();
		        var d2Y = d2.getFullYear();
		        var d1M = d1.getMonth();
		        var d2M = d2.getMonth();

		        return (d2M+12*d2Y)-(d1M+12*d1Y);
		    },
		    inYears: function(d1, d2) {
		        return d2.getFullYear()-d1.getFullYear();
		    }
		};

		return validate.refresh(dependencies)
			.then(calculIC)
			.then(function(){ return deff.promise; });
	}

	function getStockSecurity (uuid,dl) {
		// Le SS stock de securite
		var deff = $q.defer();
		var ss;

		if(typeof dl !== 'undefined'){
			getMonthlyConsumption(uuid,inventory.nb)
			.then(function (cm) {
				ss = cm * dl;
				inventory.ss = ss;
				deff.resolve(ss);
			});
		}else {
			getMonthlyConsumption(uuid,inventory.nb)
			.then(function (cm) {
				var CM = cm;
				getDelaiLivraison(uuid)
				.then(function (dl){
					ss = CM * dl;
					inventory.ss = ss;
					deff.resolve(ss);
				});
			});
		}

		return deff.promise;
	}

	function getExpirationRisk (uuid) {
		// Summary :
		// Cette fonction calcul les risques a perimer RP des lots
		var deff = $q.defer();
		dependencies.monthsBeforeExpiration = {};
		dependencies.monthsBeforeExpiration.query = '/getMonthsBeforeExpiration/'+uuid;

		function calculRP (models) {
			var months_before_expiration = models.monthsBeforeExpiration.data;
			inventory.lots_expiration = months_before_expiration;
			deff.resolve(months_before_expiration);
		}

		return validate.refresh(dependencies)
			.then(calculRP)
			.then(function(){ return deff.promise; });

	}

	function inventoryData (uuid,dl,ic) {
		// Summary :
		// uuid : le uuid de l'inventory
		// dl : (optionel) le delai de livraison ! important
		// ic : (optionel) l'intervalle de commande

		// cette fonction retourne un objet json
		// Exemple : 
		// {
		//	cm: 26250 //Consommation mensuelle
		// 	dl: 3 //Delai de livraison
		// 	ic: 4 //Intervalle de Commande
		// 	lots_expiration: Array[2] //Les lots de cette inventory
		// 	mois_stock: 0.3047619047619048 // Le mois de stock (a arrondir)
		// 	nb: 4 // Le nombre de mois pour le calcul de la consommation mensuelle (nb doit etre < 6)
		// 	q: 254500 //
		// 	s_max: 262500 // Stock Max
		// 	s_min: 157500 // Stock Min
		// 	ss: 78750 // Stock de securite
		// 	stock: 8000 // L'etat du stock
		//  stock_init: 113000 // Le cumul des differentes entrees dans le stock
		// }

		var deff = $q.defer();

		getNombreMoisAVG(uuid)
		.then(function (nb) {
			getMonthlyConsumption(uuid,nb)
			.then(function (cm) {
				getDelaiLivraison(uuid,dl)
				.then(function () {
					getIntervalleCommande(uuid,ic)
					.then(function () {
						getStockSecurity(uuid,dl)
						.then(function (ss) {
							getExpirationRisk(uuid)
							.then(function () {
								ic = ic || 1;
								inventory.s_min = inventory.ss * 2;
								inventory.s_max = inventory.cm * ic + inventory.s_min;
								if(inventory.cm > 0) {
									inventory.mois_stock = inventory.stock / inventory.cm;
								}else {
									inventory.mois_stock = 0;
								}
								inventory.q = inventory.s_max - inventory.stock;
								deff.resolve(inventory);
							});
						});
					});
				});
			});
		});

		return deff.promise;
	}

	//Output
	this.inventoryData = inventoryData;
	
}]);