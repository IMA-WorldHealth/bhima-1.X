

exports.convertToMysqlDate = function(dateString){
	return new Date().toMySqlDate(dateString);
}

Date.prototype.toMySqlDate = function (dateParam) {
	var date = new Date(dateParam), annee, mois, jour;
	annee = String(date.getFullYear());
	mois = String(date.getMonth() + 1);
	if (mois.length === 1) {
	mois = "0" + mois;
	}

	jour = String(date.getDate());
	if (jour.length === 1) {
	  jour = "0" + jour;
	}      
	return annee + "-" + mois + "-" + jour;
};