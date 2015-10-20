// Fixing account parent
'use strict';

var db = require('../../../server/lib/db'),
		q  = require('q');

db.initialise();

(function queryAccount() {
	var sqlUpdateMatch = 'UPDATE account a JOIN account b ON a.parent=b.account_number SET a.parent=b.id '+
	 										 'WHERE a.is_ohada=b.is_ohada;';
	var sqlAccount 		 = 'SELECT * FROM account;';

	executeUpdate()
	.then(executeAccount)
	.then(unmatchAccount)
	.then(updateParent)
	.then(success)
	.catch(error)
	.done(endProcess);

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
		return db.exec(sqlAccount);
	}

	function unmatchAccount(accounts) {
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
				var cut    = 0;
				var accountObject;
				// on retranche progressivement un caractere de account.parent
				// afin de trouver le bon compte
				while (cut !== chaine.length) {
					accountObject = getAccount(chaine.substr(0, chaine.length - cut), acc.is_ohada);
					if (accountObject) {
						acc.parent = accountObject.id;
						break;
					}
					cut++;
				}
			}
		});

		function getAccount(account_number, isOhada) {
			/*
			 * Objectif : Cherche le compte qui a pour account_number= 'account_number'
			 * isOhada est un critere pour placer les comptes dans les parents de leur nature
			 * c-a-d les comptes ohada dans les parents ohada et vice versa
			 */
			account_number = Number(account_number);
			var result = null;
			for(var i in accounts) {
				if (accounts[i].account_number === account_number && accounts[i].is_ohada === isOhada) {
					result = accounts[i];
					break;
				}
			}
			return result;
		}

		return accounts;
	}

	function updateParent(accounts) {
		/*
		 * Objectif : Application des mise a jour dans la base de donnees
		 */
		var sql = 'UPDATE account SET parent=? WHERE account.id=? ;';
		var dbPromises = accounts.map(function (acc) {
			return db.exec(sql, [acc.parent, acc.id]);
		});
		return q.all(dbPromises);
	}

	function success() {
		console.log('Update parent with success...');
	}

	function endProcess() {
		process.exit(0);
	}

	function error(err) {
		console.error('An error occured : ', err);
	}
})();
