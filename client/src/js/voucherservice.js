angular.module('bhima.services')
.service('VoucherService', ['exchange', function (exchange) {

  this.rows = [];

  function datarow() {
    return {
      debit : null,
      credit : null,
      account_id : null,
      selectEntity : false,
      dctype : 'd'
    };
  }

  // sums the rows in one loop!
  function total(rows) {
    return rows.reduce(function (totals, row) {
      totals.debit += row.debit;
      totals.credit += row.credit;
      return totals;
    }, { debit : 0, credit : 0 });
  }

  // make sure rows have a valid account and amount
  function validate(rows) {
    return rows.every(function (row) {
      var validAmount, validAccount;

      validAmount =
        (row.debit > 0 && !row.credit) ||
        (!row.debit && row.credit > 0);

      validAccount =
        angular.isDefined(row.deb_cred) ||
        angular.isDefined(row.account);

      return validAmount && validAccount;
    });
  }

  // add a new row to the view
  this.addRow = function () {
    this.rows.push(datarow());
  };
}]);
