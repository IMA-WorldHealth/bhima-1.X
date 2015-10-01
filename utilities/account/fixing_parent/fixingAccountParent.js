// Fixing account parent
'use strict';

var db = require('../../../server/lib/db'),
		q  = require('q');

db.initialise();

(function queryAccount() {
	var accounts;
	var sqlUpdateMatch = 'UPDATE account a JOIN account b ON a.parent=b.account_number SET a.parent=b.id ;';
	var sqlAccount 		 = 'SELECT * FROM account;';

	executeUpdate()
	.then(executeAccount())
	.then(unmatchAccount)
	.then(updateParent);

	function executeUpdate() {
		/*
		 * Objectif : Mettre a jour le parent d'un compte selon la correspondance
		 * account.parent = account.account_number
		 */
		return db.exec(sqlUpdateMatch);
	}

	function executeAccount() {
		/*
		 * Objectif : recuperation des comptes dans la variable accounts
		 */
		return db.exec(sqlAccount)
		.then(function (data) { accounts = data; });
	}

	function unmatchAccount() {
		/*
		 * Objectif : Mettre a jour le parent d'un compte selon que :
		 * account.parent fait partie de account.account_number (partiellement)
		 * rechercher le compte qui a pour account_number egale a ce account.parent
		 * si ce compte n'existe pas, on retranche de account.parent le dernier caractere
		 * puis on refait la recherche
		 */

		accounts.forEach(function (acc) {
			if (String(acc.account_number).indexOf(acc.parent) === 0) {
				// account.parent fait partiellemnt partie de account.account_number
				var chaine = String(acc.parent);
				var end    = false;
				var cut    = 0;
				var accountId;
				// on retranche progressivement un caractere de account.parent
				// afin de trouver le bon compte
				while (!end && cut !== chaine.length) {
					accountId = getAccountId(chaine.substr(0, chaine.length - cut));
					if (accountId) {
						end = true;
						acc.parent = accountId;
					} else {
						cut++;
					}
				} 
			}
		});
		
		function getAccountId(account_number) {
			/*
			 * Objectif : Cherche le compte qui a pour account_number= 'account_number'
			 */
			account_number = Number(account_number);
			var result = null;
			for(var i in accounts) {
				if (accounts[i].account_number === account_number) {
					result = accounts[i].id;
					break;
				}
			}
			return result;
		}
	}

	function updateParent() {
		/*
		 * Objectif : Application des mise a jour dans la base de donnees
		 */
		var dbPromises = [];
		accounts.forEach(function (acc) {
			var sql = 'UPDATE account SET parent=? WHERE account.id=? ;';
			var value = [acc.parent, acc.id];
			dbPromises.push(db.exec(sql, value));
		});
		q.all(dbPromises)
		.then(function () {
			console.log('Update success...');
		});
	}
})();