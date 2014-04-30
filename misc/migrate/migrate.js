#!usr/local/bin/node

var fs = require('fs');

// Takes in a dmp file and spits out the migrated bit
var infile = process.argv[2],
    outfile = process.argv[3];

var data = fs.readFileSync(infile, 'utf8');
var keys = [
  "`country`",
  "`province`",
  "`sector`",
  "`village`",
  "`currency`",
  "`exchange_rate`",
  "`enterprise`",
  "`project`",
  "`user`",
  "`unit`",
  "`permission`",
  "`project_permission`",
  "`fiscal_year`",
  "`period`",
  "`account_type`",
  "`account`",
  "`period_total`",
  "`inventory_group`",
  "`inventory_type`",
  "`inventory_unit`",
  "`inventory`",
  "`price_list`",
  "`price_list_item`",
  "`debitor_group`",
  "`debitor`",
  "`debitor_group_history`",
  "`patient_group`",
  "`patient`",
  "`patient_visit`",
  "`assignation_patient`",
  "`sale`",
  "`sale_item`",
  "`credit_note`",
  "`cash_box`",
  "`cash_box_account_currency`",
  "`cash`",
  "`cash_item`",
  "`caution_box`",
  "`caution_box_account_currency`",
  "`caution`",
//  "`pcash`",
  "`transaction_type`",
  "`posting_journal`",
  "`general_ledger`"
];

var statements = [];

function rip (key, dataset) {
  var query = "INSERT INTO " + key + " ";
  var idx = dataset.indexOf(query);
  var count = 0;
  while (idx !== -1) {
    count += 1;
    var end = dataset.indexOf(');', idx + query.length + 3);
    var statement = dataset.substring(idx, end+2);
    statements.push(statement);
    idx = dataset.indexOf(query, idx+1);
  }

  console.log('Dumping %s row(s) for %s', count, key);
}

function run () {
  console.log('Ripping started for %s keys', keys.length);

  keys.forEach(function (key) {
    rip(key, data);
  });

  console.log('Ripping finished.  Writing results to "%s"', outfile);
  fs.writeFileSync(outfile, statements.join('\n'));
  console.log('File written successfully.');
}

run();
