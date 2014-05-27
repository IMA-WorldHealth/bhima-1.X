angular.module('bhima.services')
.service('util', function () {
  this.formatDate = function(dateString) {
    return new Date(dateString).toDateString();
  };

  this.convertToMysqlDate = function (dateParam) {
    var date = new Date(dateParam),
      annee,
      mois,
      jour;
    annee = String(date.getFullYear());
    mois = String(date.getMonth() + 1);
    if (mois.length === 1) {
      mois = '0' + mois;
    }

    jour = String(date.getDate());
    if (jour.length === 1) {
      jour = '0' + jour;
    }
    return annee + '-' + mois + '-' + jour;
  };

  this.isDateAfter = function(date1, date2){
    date1 = new Date(date1).setHours(0,0,0,0);
    date2 = new Date(date2).setHours(0,0,0,0);
    return date1 > date2;
  };

  this.areDatesEqual = function(date1, date2) {
    date1 = new Date(date1).setHours(0,0,0,0);
    date2 = new Date(date2).setHours(0,0,0,0);
    return date1 === date2;
  };

  this.sqlDate = this.convertToMysqlDate;

});
