
util = require('../util/util');
module.exports = function (db, sanitize) {
  //aB : accountBalance
  var menu_map = {
    'aB' : aB
  }

  function aB (enterprise_id, account_ids, callback){
    var query = JSON.parse(account_ids);
    var acIds = query.accounts.map(function(item){
      return sanitize.escape(item);
    });
    var portion = '`t`.`account_id`='+acIds.join(' OR `t`.`account_id`=');

    var sql = 'SELECT SUM(`debit_equiv` - `credit_equiv`) as balance, `account_id` '+
      'FROM ((SELECT `debit_equiv`, `credit_equiv`, `enterprise_id`, `account_id`, `currency_id` FROM `posting_journal`)'+
      ' UNION (SELECT `debit_equiv`, `credit_equiv`, `enterprise_id`, `account_id`, `currency_id` FROM `general_ledger`)) as `t`'+
      ' WHERE '+portion+' AND `t`.`enterprise_id`='+sanitize.escape(enterprise_id)+' GROUP BY `account_id`;';

    db.execute(sql, function(err, ans){
      if(err) return callback(err, null)
      return callback(null, ans);
    });
  }

  return function menu (goal, enterprise_id, account_ids, callback) {
    return menu_map[goal] ? menu_map[goal](enterprise_id, account_ids, callback) :  new Error('Incorrect/invalid route');
  };
};
