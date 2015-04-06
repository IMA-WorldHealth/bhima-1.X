var Q = require('q');
var querystring = require('querystring');
var url = require('url');

var db = require('./../lib/db');
var sanitize = require('./../lib/sanitize');
var util = require('./../lib/util');

var _REPORT_ID;

function getAllReports (req, res) {

	var sql = 'SELECT id, date FROM mod_snis_rapport ORDER BY id DESC';
	db.exec(sql, function (err, rows){
		if(err)throw err;
		res.send(rows);
	});
}

function createReport (req, res) {
	
	// Creation Nouveau Rapport
	var newReport = function(req){
		var project_id = req.body.params.project_id;
		var period = req.body.params.period;
		var	sql, query, isNew;

		var check_rapport = function(){
			var def = Q.defer();

			sql = 'SELECT * FROM mod_snis_rapport WHERE MONTH(date) LIKE MONTH("' + period + '") AND YEAR(date) LIKE YEAR("' + period + '");';
			db.exec(sql)
			.then(function (rows){
				if (rows.length > 0) {
					isNew = false;
					def.resolve(isNew);
				} else {
					isNew = true;
					console.log('Creation nouveau rapport possible');
					//Resolve
					def.resolve(isNew);
				}
			})
			.catch(function (err) {
				console.log(err);
			});
			return def.promise;
		};

		var insert_or_update = function (){
			var def = Q.defer();

			if (isNew === true) {
				sql = 'INSERT INTO mod_snis_rapport(date,id_snis_hopital) VALUES (DATE("' + period + '"),"' + project_id + '");';
				db.exec(sql)
				.then(function (row) {
					_REPORT_ID = row.insertId;
					def.resolve(_REPORT_ID);
				});
			} else {
				console.log("Le rapport pr ce mois [" + period + "] existe deja");
			}

			return def.promise;
		}

		//Verification puis insertion ou modification
		return check_rapport()
		.then(insert_or_update);
	};

	// Identification data
	var insertDataIdentification = function(req){
		var id_rapport = _REPORT_ID,
			project_id = req.body.params.project_id,
			zs_id = req.body.params.zs_id,
			id_employe_medecin_dir = req.body.params.id_employe_medecin_dir,
			date_envoi = req.body.params.date_envoi,
			id_employe_envoi = req.body.params.id_employe_envoi,
			date_reception = req.body.params.date_reception,
			id_employe_reception = req.body.params.id_employe_reception,
			date_encodage = req.body.params.date_encodage,
			id_employe_encodage = req.body.params.id_employe_envoi,
			info = req.body.params.info;

			//Insertion
			if (project_id){
				sql = 'INSERT INTO mod_snis_identification(id_rapport,id_hopital,id_zs,id_employe_medecin_dir,date_envoie,date_reception,date_encodage,information,id_employe_envoi,id_employe_reception,id_employe_encodage)';
				sql +=' VALUES ("'+id_rapport+'","'+project_id+'","'+zs_id+'","'+id_employe_medecin_dir+'","'+date_envoi+'","'+date_reception+'","'+date_encodage+'","'+info+'","'+id_employe_envoi+'","'+id_employe_reception+'","'+id_employe_encodage+'")';
				db.exec(sql)
				.then(function(){
					console.log("[db] insertion donnees identification ok ...");
				})
				.catch(function (err){
					console.error("[error]: ", err);
				});
			}
	};

	//Update
	var updateDataIdentification = function(req){
		var id_rapport = _REPORT_ID,
			project_id = req.body.params.project_id,
			zs_id = req.body.params.zs_id,
			id_employe_medecin_dir = req.body.params.id_employe_medecin_dir,
			date_envoi = req.body.params.date_envoi,
			id_employe_envoi = req.body.params.id_employe_envoi,
			date_reception = req.body.params.date_reception,
			id_employe_reception = req.body.params.id_employe_reception,
			date_encodage = req.body.params.date_encodage,
			id_employe_encodage = req.body.params.id_employe_envoi,
			info = req.body.params.info;

		//Update
		if(project_id){
			sql = 'UPDATE mod_snis_identification SET id_hopital="'+project_id+'", id_zs="'+zs_id+'", date_envoie = "'+date_envoi+'", date_reception = "'+date_reception+'", date_encodage = "'+date_encodage+'", information = "'+info+'", id_employe_envoi = "'+id_employe_envoi+'", id_employe_reception = "'+id_employe_reception+'", id_employe_encodage = "'+id_employe_encodage+'"';
			sql +=' WHERE id_rapport = "' + id_rapport +'"';

			db.exec(sql)
			.then(function(){
				console.log("[db] update donnees identification ok ...");
			})
			.catch(function (err){
				console.error("[error]: ", err);
			});
		}
	};

	//Save Identification
	var saveDataIdentification = function(req){
		var sql = 'SELECT * FROM mod_snis_identification WHERE id_rapport = "' + _REPORT_ID +'"';
		db.exec(sql)
		.then(function(rows){
			if(rows.length > 0){
				updateDataIdentification(req);
			}else{
				insertDataIdentification(req);
			}
		})
		.catch(function (err){
			console.error("[error]: ", err);
		});
	};

	newReport(req)
	.then(function (data) {
		saveDataIdentification(req);
		res.sendStatus(200);
	});
}

function deleteReport (req, res) {
	var sql = 'DELETE FROM mod_snis_rapport WHERE id="'+req.params.id+'"';
	db.exec(sql, function (err, rows){
		if(err)throw err;
		res.sendStatus(200);
	});
}

function populateReport (req, res) {

	var insertSnisRapport = function(req){
		var tabrecuperation = req.body.params.data;
		var requeteNameAttribut = "SELECT * FROM mod_snis_attribut_form";

		db.exec(requeteNameAttribut)
		.then(function(ans){
			if(ans.length){
				for (item in ans){
					var Form = ans[item];
					idAttribut = Form.id;
					nameAttribut = Form.attribut_form;
					if((nameAttribut) && (tabrecuperation[nameAttribut])){
						var ReqInsertion = "INSERT INTO mod_snis_monthly_report (id_attribut_form,value,id_month) VALUES ('" + idAttribut + "','" + tabrecuperation[nameAttribut] + "','"+_REPORT_ID+"')";
						db.exec(ReqInsertion);
					}			
				}
			}
		})
		.catch(function(err){
			console.error('[error]: ', err);
		});
	};

	//UPDATE DATA
	var updateSnisRapport = function(req){
		var tabrecuperation = req.body.params.data;
		var requeteNameAttribut = "SELECT * FROM mod_snis_attribut_form";

		db.exec(requeteNameAttribut)
		.then(function(ans){
			if(ans.length){
				for (item in ans){
					var Form = ans[item];
					idAttribut = Form.id;
					nameAttribut = Form.attribut_form;
					if((nameAttribut) && (tabrecuperation[nameAttribut])){
						var ReqUpdate = "UPDATE mod_snis_monthly_report SET id_attribut_form = '" + idAttribut + "', value = '" + tabrecuperation[nameAttribut] + "' WHERE id_month = '"+_REPORT_ID+"'";
						db.exec(ReqUpdate);	
					}			
				}
			}
		})
		.catch(function(err){
			console.error('[error]: ', err);
		});
	};

	//Save Data Rapport
	var saveSnisRapport = function(req) {
		if (_REPORT_ID) {
			var sql = 'SELECT * FROM mod_snis_monthly_report WHERE id_month = "' + _REPORT_ID +'"';
			db.exec(sql)
			.then(function(rows){
				console.log(rows);
				if(rows.length > 0){
					//Iserer d'abord
					insertSnisRapport(req);
					//Puis Update
					updateSnisRapport(req);
				}else{
					//Insertion data
					insertSnisRapport(req);
				}
			})
			.catch(function(err){
				console.error('[error]: ', err);
			});
		}
	};

	saveSnisRapport(req);
	res.sendStatus(200);
}

// Expose
module.exports = {
	getAllReports : getAllReports,
	createReport  : createReport,
	deleteReport  : deleteReport,
	populateReport: populateReport
};