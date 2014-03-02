// scripts/lib/logic/rt.js

// Routes that provide real-time reports on
// information such as 
//   [1] Number of patient registered
//     [1.1] Number of New/Returning patients registered
//   [2] Number of sales created/processed 
//   [3] Inventory groups/categories sold
// over any time period.  In particular,
//   [1] Today
//   [2] This Week
//   [3] This Month
//   [4] XX-XX-XXXX -- YY-YY-YYYY

var parser = require('../database/parser')(),
    sanitize = require('../util/sanitize'),
    util = require('../util/util');

module.exports = function (db) {
  // URL structure is expected to be:
  //    "rt/type/enterprise_id/start/end/"
  // where the type is defined by:
  //  /p/ -> patients
  //  /i/ -> inventory
  //  /r/ -> sales receipts

  function p(id, start, end, done) {
    // processes patient data over time
    // FIXME: There is currently no enterprise
    // id appended to patient data.  Should there
    // be?
    var sql =
      "SELECT patient.id, debitor_id, first_name, last_name, dob, father_name, " +
          "sex, religion, renewal, registration_date, date " +
        "FROM `patient` JOIN `patient_visit` ON " +
          "`patient`.`id`=`patient_visit`.`patient_id` " +
        "WHERE `date` > " + start + " AND " +
          " `date` < " + end + ";";
    db.execute(sql, done);
  }

  function i(id, start, end, done) {
    // Fetch all processed invoices between 'start' and 'end' for
    // enterprise with 'id'
    var sql =
      "SELECT i.id, ig.code, ig.name, ig.sales_account, SUM(si.quantity) AS quantity, " +
        "SUM(si.transaction_price) AS total_price, s." +
      "FROM `sale` AS s JOIN `sale_item` as si JOIN `inventory` AS i JOIN `inventory_group` AS ig " +
      "ON s.id = si.sale_id AND si.inventory_id = i.id AND i.group_id = ig.id " +
      "WHERE s.invoice_date > " + start + " AND " +
        "s.invoice_date < " + end + " AND " +
        "i.enterprise_id = " + id + " " +
      "ORDER BY i.code " +
      "GROUP BY i.id;";
    db.execute(sql, done);
  }

  function r(id, start, end, done) {
    // TODO
  }

  var map = {
    'p' : p,
    'i' : i,
    'r' : r
  };

  return function route (type, id, start, end, done) {
    var _start = sanitize.escape(util.toMysqlDate(new Date(start))),
        _end =  sanitize.escape(util.toMysqlDate(new Date(end))),
        _id = sanitize.escape(id);

    return map[type] ?
      map[type](_id, _start, _end, done) :
      new Error('Incorrect/invalid route');
  };
};
