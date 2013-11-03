var db = require("../lib/database/db")();

// post_to_gl [Function]
// summary:
//    validates that the data from the journal is correct
//    and posts it to the general ledger, and erases the data
//    in the journal table.
// params:
//    arr [Array]
//      An array of row ids in the JOURNAL table.
// returns: [Boolean]
function post_to_gl(arr) {
  var sql = "SELECT * FROM journal WHERE id=?",
      id;

  arr.forEach(function(v) {
    id = db.escape(v);
  }); 
}

// post_to_journal
// summary:
//      validates that the data in the sales table is
//      correct and posts it to the journal for review.
function post_to_journal(id) {
  // TODO
}




