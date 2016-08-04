// Clean up the data of employee_standing
//
// USAGE:   node employee_standing.js 
//

var fs = require('fs');


// Set up the database
var db = require('../../server/lib/db');
db.initialise();

var updateQuery = 'use bhima;\n';
var sql = 
  'SELECT posting_journal.trans_id, posting_journal.origin_id, posting_journal.description, ' +
  'posting_journal.account_id, posting_journal.deb_cred_type,  posting_journal.deb_cred_uuid ' +
  'FROM posting_journal ' +
  'WHERE posting_journal.origin_id IN (21, 23, 24) AND posting_journal.deb_cred_type = \'C\' ' + 
  'AND posting_journal.account_id = 2806 ';

db.exec(sql)
.then(function (transactions) {

  transactions.forEach(function (transaction) {
    var sql2 = 
      'SELECT employee.debitor_uuid, employee.creditor_uuid, employee.name, debitor_group.account_id ' +
      'FROM employee ' +
      'JOIN debitor ON debitor.uuid = employee.debitor_uuid ' +
      'JOIN debitor_group ON debitor_group.uuid =  debitor.group_uuid ' +
      'WHERE employee.creditor_uuid = \'' + transaction.deb_cred_uuid + '\'';  

    db.exec(sql2)
    .then(function (result) {

      var sqlUpdate = 
        'UPDATE posting_journal ' +
          'SET posting_journal.account_id = ' + result[0].account_id + ' ' +
          ',posting_journal.deb_cred_uuid = \'' + result[0].debitor_uuid + '\' ' +
        'WHERE posting_journal.origin_id IN (21, 23, 24) AND posting_journal.deb_cred_type = \'C\' ' +
        ' AND posting_journal.trans_id = \'' + transaction.trans_id + '\' '; 

      db.exec(sqlUpdate)
      .then(function (updating) {
        console.log(updating);

      })  

    });       

  });
})
.catch(function (err) { throw err; })
.done();


