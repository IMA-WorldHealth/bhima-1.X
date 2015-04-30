var db = require('../../server/lib/db');
var guuid = require('../../server/lib/guid');
var xlsx = require('xlsx');

var book = xlsx.readFile('janv.xlsx');
var sheet = book.Sheets[book.SheetNames[1]];
var JSONSheet = xlsx.utils.sheet_to_json(sheet);

var pcgc = [], errors = [], stop = false, transactions = [];
var project_id = 1, fiscal_year_id = 2, period_id = 15;


db.initialise();

function getPCGCAccounts () {
	console.log('[INFO] : Extraction Compte PCGC ...');
	var req = "SELECT `id`, `account_number`, `account_txt` FROM `account`WHERE `is_ohada` = 0";
	return db.exec(req);
}

function checkSheet (){
	var errors = [];
	JSONSheet.forEach(function (item){
		var result = isPCGC(item.CPT);
		if(result == false) errors.push('Compte inexistant ' + item.CPT);
	});
	return errors;
}

function isPCGC(cpt){
	return pcgc.some(function (item){
		return item.account_number == cpt.trim();
	});
}

function processCheckingResult (){
	if(errors.length){
		console.log(errors);
		stop = true;
	}
}

function getTransactions (doc){
	var occurences = [];
	occurences = JSONSheet.filter(function (item){
		return item.DOC == doc;
	});
	return occurences;
}

function groupWrittingByTransaction (){
	var procesedDOC = []; //contains all doc num processed
	var transactions = [];
	JSONSheet.forEach(function (item){
		item.DOC = item.DOC.trim();
		if(procesedDOC.indexOf(item.DOC) == -1){
			procesedDOC.push(item.DOC);
			var res = getTransactions(item.DOC);
			// if(res.length < 2) errors.push('Transaction incomplete DOC :' + item.DOC);
			transactions.push(res);
		}
	});
	return transactions;
}

getPCGCAccounts()
.then(function (ans){
	pcgc = ans;
	console.log('[INFO] Compte PCGC recuperes ...')
	console.log('[INFO] Verification existance de correspondance entre PCGC et le fichier ...');
	errors = checkSheet();
	processCheckingResult();

	console.log('[INFO] Fin verification correspondance ...');
	if(stop) {
		console.log('[INFO] Arret du script!');
		return;
	} else {
		errors = [];
	}

	console.log('[INFO] Groupement par transaction ...');
	transactions = groupWrittingByTransaction();
	console.log('[INFO] Groupement termine ...');
	console.log('nombre de transaction : ', transactions.length);
});




