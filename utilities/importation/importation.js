var db = require('../../server/lib/db');
var guuid = require('../../server/lib/guid');
var xlsx = require('xlsx');
var sanitize = require('../../server/lib/sanitize');
var fs = require('fs');

var book = xlsx.readFile('report.xlsx');
var sheet = book.Sheets[book.SheetNames[1]];
var JSONSheet = xlsx.utils.sheet_to_json(sheet);

//base config
var pcgc = [], errors = [],
	stop = false, transactions = [],
	initial_trans_id = 1, project_name = 'HBB',
	lines = [];

//invariant info in posting_journal
var project_id = 1, fiscal_year_id = 2,
	period_id = 15, trans_date = "2015-01-01", currency_id = 2,
	comment = 'Report 2013', origin_id = 9,
	user_id = 1;

console.log('[INFO] traitement feuille : ' + book.SheetNames[1] + " en cours ...");


db.initialise();

function getPCGCAccounts () {
	console.log('[INFO] : Extraction Compte PCGC ...');
	var req = "SELECT `id`, `account_number`, `account_txt` FROM `account`WHERE `is_ohada` = 0 OR ISNULL(is_ohada)";
	return db.exec(req);
}

function checkSheet (){
	var errors = [];
	JSONSheet.forEach(function (item){
		// console.log(item);
		var result = isPCGC(item.CPT);
		if(result == false){
			if(errors.indexOf(item.CPT.trim()) == -1){
				errors.push(item.CPT.trim());
			}
		}
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
		console.log('Compte inexistant ', errors);
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
		var deb = item.DEBIT;
		deb = String(deb).replace(/ /g, '');
		deb = String(deb).replace(/,/g, '');
		item.DEBIT = deb;
		var cred = item.CREDIT;
		cred = String(cred).replace(/ /g, '');
		cred = String(cred).replace(/,/g, '');
		item.CREDIT = cred;
		if(procesedDOC.indexOf(item.DOC) == -1){
			procesedDOC.push(item.DOC);
			var res = getTransactions(item.DOC);
			transactions.push(res);
		}
	});
	return transactions;
}

function getAccountID (cpt){
	return pcgc.filter(function (item){
		return item.account_number == cpt;
	})[0].id;
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

	transactions.forEach(function (transaction, index){
		var uuid,
			trans_id = project_name + (initial_trans_id + index),
			doc_num = transaction[0].DOC, debit, credit, debit_equiv, credit_equiv, description, account_id;

		transaction.forEach(function (item){
			uuid = guuid();
			account_id = getAccountID(item.CPT);
			debit = item.DEBIT;
			credit = item.CREDIT;
			debit_equiv = item.DEBIT;
			credit_equiv = item.CREDIT;
			description = (item.LIB) ? item.LIB : 'Pas de description';

			var string = '(' + [
								sanitize.escape(uuid),
								project_id,
								fiscal_year_id,
								period_id,
								sanitize.escape(trans_id),
								sanitize.escape(trans_date),
								doc_num,
								sanitize.escape(description),
								account_id,
								debit,
								credit,
								debit_equiv,
								credit_equiv,
								currency_id,
								sanitize.escape(comment),
								origin_id,
								user_id
							   ].join(', ') + ')';

			lines.push(string);
		});
	});

	console.log('Nombre de ligne : ', lines.length);

	var request = "INSERT INTO `posting_journal` (`uuid`, `project_id`, `fiscal_year_id`, `period_id`, " +
				  " `trans_id`, `trans_date`, `doc_num`, `description`, `account_id`, `debit`, `credit`, " +
				  " `debit_equiv`, `credit_equiv`, `currency_id`, `comment`, `origin_id`, `user_id`) VALUES " +
				  lines.join(', ') + ";";

	console.log("[INFO] Ecriture dans le fichier" + "report_" + book.SheetNames[1] + ".sql" + " encours ...");

	fs.writeFile("report_" + book.SheetNames[1] + ".sql" , request, function(err) {
	    if(err) {
	    	console.log(err);
	        return; 
	    }
	    console.log("[INFO] Ecriture terminee !!!");
	});
});




