// parse the articles into a fashion that works wit our inventory


var fs = require('fs');
var file = fs.readFileSync('./list_des_articles_25_Feb_14.tab', 'utf8');

var stock = file.split('\r\n');

// return a packaged item
// defaults a lot of inventory items
// fields
//

var groupMap = {
  1  : 1,
  2  : 2,
  3  : 3,
  4  : 4,
  5  : 5,
  6  : 6,
  7  : 7,
  8  : 8,
  9  : 9,
  91  : 10,
  10 : 11,
  11 : 12,
  12 : 13,
  13 : 14,
  14 : 15,
  15 : 16,
  16 : 17,
  17 : 18,
  18 : 19,
  19 : 20
};

function item (line) {
  var columns = ['code', 'text', 'cfr', 'price'];
  var o = {};
  line.forEach(function (item, idx) {
    o[columns[idx]] = item.trim() || 0.00;
  });
  o.enterprise_id = 200;
  o.group_id = groupMap[Number(line[0].slice(0,2)) || 1];
  o.unit_id = 2;
  o.stock = 1;
  o.stock_max = 100000000;
  o.type_id = 0;
  o.consumable = 1;
  o.stock_min = 0;
  delete o.cfr;
  return o;
}

// we'll store JSON objects in here
var items = [];
stock.forEach(function (line, idx) {
  var i = item(line.split('|'));
  if (i.code) {
    items.push(i);
  }
});

var query =
  "INSERT INTO `inventory` (`code`, `text`, `price`, `enterprise_id`, `group_id`, `unit_id`, `stock`, `stock_max`, `type_id`, `consumable`, `stock_min`) VALUES ";

var rows = [];

items.forEach(function (item) {
  var row = [];
  for (var col in item) {
    row.push('"' + String(item[col]).replace(/\"/g, '') + '"');
  }
  rows.push("(" + row.join(',') + ")");
});

query += rows.join(',\n') + ";";

// some examples
fs.writeFileSync('inventory.sql', query, 'utf8');
