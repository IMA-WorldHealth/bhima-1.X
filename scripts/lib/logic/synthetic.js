
util = require('../util/util');
module.exports = function (db, sanitize) {
  //aB : accountBalance
  //pcR : principal caisse balance report by date
  //pcRI : principal caisse total income by date
  var menu_map = {
    'aB'    : aB,
    'pcR'   : pcR,
    'pcRI'  : pcRI
  }

  function aB (enterprise_id, request, callback){
    var query = JSON.parse(request);
    var acIds = query.accounts.map(function(item){
      return sanitize.escape(item);
    });
    var portion = '`t`.`account_id`='+acIds.join(' OR `t`.`account_id`=');

    var sql = 'SELECT SUM(`debit_equiv` - `credit_equiv`) as balance, `account_id` '+
      'FROM ((SELECT `debit_equiv`, `credit_equiv`, `enterprise_id`, `account_id`, `currency_id` FROM `posting_journal`)'+
      ' UNION (SELECT `debit_equiv`, `credit_equiv`, `enterprise_id`, `account_id`, `currency_id` FROM `general_ledger`)) as `t`'+
      ' WHERE '+portion+' AND `t`.`enterprise_id`='+sanitize.escape(enterprise_id)+' GROUP BY `account_id`';

    db.execute(sql, function(err, ans){
      if(err) return callback(err, null)
      return callback(null, ans);
    });
  }

  function pcR (enterprise_id, request, callback){
    var query = JSON.parse(request);
    var acIds = query.accounts.map(function(item){
      return sanitize.escape(item);
    });
    var portion = '';
    if(acIds.length === 1){
      portion = '`t`.`account_id`='+acIds[0];
    }else{
      portion = '`t`.`account_id`='+acIds.join(' OR `t`.`account_id`=');
    }
    var sql = 'SELECT SUM(`debit_equiv` - `credit_equiv`) as balance, trans_date '+
      'FROM ((SELECT `debit_equiv`, `credit_equiv`, `enterprise_id`, `account_id`, `currency_id`, `trans_date` FROM `posting_journal`)'+
      ' UNION (SELECT `debit_equiv`, `credit_equiv`, `enterprise_id`, `account_id`, `currency_id`, `trans_date` FROM `general_ledger`)) as `t`'+
      ' WHERE '+portion+' AND `t`.`enterprise_id`='+sanitize.escape(enterprise_id)+' GROUP BY `trans_date` LIMIT 20;';
    db.execute(sql, function(err, ans){
      if(err) return callback(err, null)
      return callback(null, ans);
    });
  }

  function pcRI (enterprise_id, request, callback){
    var query = JSON.parse(request);
    var acIds = query.accounts.map(function(item){
      return sanitize.escape(item);
    });
    var portion = '';
    if(acIds.length === 1){
      portion = '`t`.`account_id`='+acIds[0];
    }else{
      portion = '`t`.`account_id`='+acIds.join(' OR `t`.`account_id`=');
    }
    var sql = 'SELECT SUM(`debit_equiv`) as total, trans_date '+
      'FROM ((SELECT `debit_equiv`, `credit_equiv`, `enterprise_id`, `account_id`, `currency_id`, `trans_date` FROM `posting_journal`)'+
      ' UNION (SELECT `debit_equiv`, `credit_equiv`, `enterprise_id`, `account_id`, `currency_id`, `trans_date` FROM `general_ledger`)) as `t`'+
      ' WHERE '+portion+' AND `t`.`enterprise_id`='+sanitize.escape(enterprise_id)+' GROUP BY `trans_date` LIMIT 20;';
    db.execute(sql, function(err, ans){
      if(err) return callback(err, null)
      return callback(null, ans);
    });
  }

  return function menu (goal, enterprise_id, request, callback) {
    return menu_map[goal] ? menu_map[goal](enterprise_id, request, callback) :  new Error('Incorrect/invalid route');
  };
};
