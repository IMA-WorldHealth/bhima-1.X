#!usr/local/bin/node

var fs = require('fs');

// Takes in a dmp file and spits out the migrated bit
var infile = process.argv[2],
    outfile = process.argv[3];

var data = fs.readFileSync(infile, 'utf8');
var keys = {
  '`country`'                      : ' (`uuid`, `code`, `country_en`, `country_fr`) ',
  '`province`'                     : ' (`uuid`, `name`, `country_uuid`) ',
  '`sector`'                       : ' (`uuid`, `name`, `province_uuid`) ',
  '`village`'                      : ' (`uuid`, `name`, `sector_uuid`) ',
  '`currency`'                     : ' (`id`, `name`, `symbol`, `note`, `separator`, `decimal`, `min_monentary_unit`) ',
  '`exchange_rate`'                : ' (`id`, `enterprise_currency_id`, `foreign_currency_id`, `rate`, `date`) ',
  '`enterprise`'                   : ' (`id`, `name`, `abbr`, `phone`, `email`, `location_id`, `logo`, `currency_id`) ',
  '`project`'                      : ' (id, name, abbr, enterprise_id) ',
  '`cost_center`'                  : ' (`project_id`, `id`, `text`, `note`, `is_principal`) ',
  '`profit_center`'                : ' (`project_id`, `id`, `text`, `note`) ',
  '`service`'                      : ' (`id`, `project_id`, `name`, `cost_center_id`, `profit_center_id`) ',
  '`user`'                         : ' (id, username, password, first, last, email, logged_in, pin) ',
  '`unit`'                         : ' (id, name, `key`, description, `parent`, has_children, `url`, `path`) ',
  '`permission`'                   : ' (id, unit_id, user_id) ',
  '`project_permission`'           : ' (id, user_id, project_id) ',
  '`fiscal_year`'                  : ' (enterprise_id, id, number_of_months, fiscal_year_txt, transaction_start_number, transaction_stop_number, fiscal_year_number, start_month, start_year, previous_fiscal_year, locked) ',
  '`period`'                       : ' (`id`, `fiscal_year_id`, `period_number`, `period_start`, `period_stop`, `locked`) ',
  '`account_type`'                 : ' (`id`, `type`) ',
  '`account`'                      : ' (`id`, `account_type_id`, `enterprise_id`, `account_number`, `account_txt`, `parent`, `fixed`, `locked`, `cc_id`, `pc_id`, `created`, `classe`) ',
  '`period_total`'                 : ' (`enterprise_id`, `fiscal_year_id`, `period_id`, `account_id`, `credit`, `debit`, `locked`) ',
  '`inventory_group`'              : ' (`uuid`, `name`, `code`, `sales_account`, `cogs_account`, `stock_account`, `donation_account`) ',
  '`inventory_type`'               : ' (`id`, `text`) ',
  '`inventory_unit`'               : ' (`id`, `text`) ',
  '`inventory`'                    : ' (`enterprise_id`, `uuid`, `code`, `text`, `price`, `purchase_price`, `group_uuid`, `unit_id`, `unit_weight`, `unit_volume`, `stock`, `stock_max`, `stock_min`, `type_id`, `consumable`, `origin_stamp`) ',
  '`price_list`'                   : ' (`enterprise_id`, `uuid`, `title`, `description`) ',
  '`price_list_item`'              : ' (`uuid`, `item_order`, `description`, `value`, `is_discount`, `is_global`, `price_list_uuid`, `inventory_uuid`) ',
  '`debitor_group`'                : ' (`enterprise_id`, `uuid`, `name`, `account_id`, `location_id`, `payment_id`, `phone`, `email`, `note`, `locked`, `tax_id`, `max_credit`, `is_convention`, `price_list_uuid`) ',
  '`debitor`'                      : ' (`uuid`, `group_uuid`, `text`) ',
  '`debitor_group_history`'        : ' (`uuid`, `debitor_uuid`, `debitor_group_uuid`, `income_date`, `user_id`) ',
  '`patient_group`'                : ' (`enterprise_id`, `uuid`, `price_list_uuid`, `name`, `note`, `created`) ',
  '`patient`'                      : ' (`uuid`, `project_id`, `reference`, `debitor_uuid`, `creditor_uuid`, `first_name`, `last_name`, `dob`, `father_name`, `mother_name`, `profession`, `employer`, `spouse`, `spouse_profession`, `spouse_employer`, `sex`, `religion`, `marital_status`, `phone`, `email`, `addr_1`, `addr_2`, `renewal`, `origin_location_id`, `current_location_id`, `registration_date`) ',
  '`patient_visit`'                : ' (`uuid`, `patient_uuid`, `date`, `registered_by`) ',
  '`assignation_patient`'          : ' (`uuid`, `patient_group_uuid`, `patient_uuid`) ',
  '`sale`'                         : ' (`project_id`, `reference`, `uuid`, `cost`, `currency_id`, `debitor_uuid`, `seller_id`, `discount`, `invoice_date`, `note`, `posted`, `timestamp`) ',
  '`sale_item`'                    : ' (`sale_uuid`, `uuid`, `inventory_uuid`, `quantity`, `inventory_price`, `transaction_price`, `debit`, `credit`) ',
  '`credit_note`'                  : ' (`project_id`, `reference`, `uuid`, `cost`, `debitor_uuid`, `seller_id`, `sale_uuid`, `note_date`, `description`, `posted`) ',
  '`cash_box`'                     : ' (`id`, `text`, `project_id`, `is_auxillary`) ',
  '`cash_box_account_currency`'    : ' (`id`, `currency_id`, `cash_box_id`, `account_id`) ',
  '`cash`'                         : ' (`project_id`, `reference`, `uuid`, `document_id`, `type`, `date`, `debit_account`, `credit_account`, `deb_cred_uuid`, `deb_cred_type`, `currency_id`, `cost`, `user_id`, `cashbox_id`, `description`) ',
  '`cash_item`'                    : ' (`uuid`, `cash_uuid`, `allocated_cost`, `invoice_uuid`) ',
  '`caution_box`'                  : ' (`id`, `text`, `project_id`) ',
  '`caution_box_account_currency`' : ' (`id`, `currency_id`, `caution_box_id`, `account_id`) ',
  '`caution`'                      : ' (`reference`, `uuid`, `value`, `date`, `project_id`, `debitor_uuid`, `currency_id`, `user_id`, `cash_box_id`, `description`) ',
  '`primary_cash_module`'          : ' (`id`, `text`) ',
  '`transaction_type`'             : ' (`id`, `service_txt`) ',
  '`posting_journal`'              : ' (`uuid`, `project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, `doc_num`, `description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, `currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `comment`, `cost_ctrl_id`, `origin_id`, `user_id`, `cc_id`) ',
  '`general_ledger`'               : ' (`uuid`, `project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, `doc_num`, `description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, `currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `comment`, `cost_ctrl_id`, `origin_id`, `user_id`, `cc_id`) '
};

var statements = [];

function rip (key, replacement, dataset) {
  var query = 'INSERT INTO ' + key + ' ';
  var idx = dataset.indexOf(query);
  var count = 0;
  while (idx !== -1) {
    count += 1;
    var end = dataset.indexOf(');', idx + query.length + 3);
    var statement = dataset.substring(idx, end+2);
    statement = statement.replace('VALUES', replacement + 'VALUES ');
    statements.push(statement);
    idx = dataset.indexOf(query, idx+1);
  }

  console.log('Dumping %s row(s) for %s', count, key);
}

function run () {
  console.log('Ripping started for %s keys', Object.keys(keys).length);

  Object.keys(keys).forEach(function (k, idx) {
    rip(k, keys[k], data);
  });

  console.log('Ripping finished.  Writing results to %s', outfile);
  fs.writeFileSync(outfile, statements.join('\n'));
  console.log('File written successfully.');
}

run();
