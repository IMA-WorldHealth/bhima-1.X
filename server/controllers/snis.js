var q = require('q');
var querystring = require('querystring');
var url = require('url');

var db = require('./../lib/db');
var sanitize = require('./../lib/sanitize');
var util = require('./../lib/util');

function getAllReports (req, res) {

	var sql = 'SELECT id, date FROM mod_snis_rapport ORDER BY id DESC';
	db.exec(sql,function(err, rows){
		if(err)throw err;
		res.send(rows);
	});
}

// Expose
module.exports = {
	getAllReports : getAllReports
};