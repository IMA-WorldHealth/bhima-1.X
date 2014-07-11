module.exports = function (db, sanitize) {
  //aB : accountBalance
  //pcR : principal caisse balance report by date
  //pcRI : principal caisse total income by date
  //ccc  : cost center cost
  //service profit

  var menuMap = {
    'aB'    : aB,
    'pcR'   : pcR,
    'pcRI'  : pcRI,
    'ccc'   : ccc,
    'sp'    : sp
  };

  function aB (project_id, request, callback){
    var query = JSON.parse(request);
    var acIds = query.accounts.map(function(item){
      return sanitize.escape(item);
    });
    var portion = '`t`.`account_id`='+acIds.join(' OR `t`.`account_id`=');

    var sql =
      'SELECT SUM(`debit_equiv` - `credit_equiv`) as balance, `account_id` '+
      'FROM ((SELECT `debit_equiv`, `credit_equiv`, `project_id`, `account_id`, `currency_id` FROM `posting_journal`)'+
      ' UNION (SELECT `debit_equiv`, `credit_equiv`, `project_id_id`, `account_id`, `currency_id` FROM `general_ledger`)) as `t`'+
      ' WHERE '+portion+' AND `t`.`project_id`='+sanitize.escape(project_id)+' GROUP BY `account_id`';

    db.execute(sql, function(err, ans){
      if (err) { return callback(err); }
      return callback(null, ans);
    });
  }

  function pcR (project_id, request, callback){
    var query = JSON.parse(request);
    var acIds = query.accounts.map(function(item){
      return sanitize.escape(item);
    });
    var portion = '';
    if (acIds.length === 1){
      portion = '`t`.`account_id`='+acIds[0];
    }else{
      portion = '`t`.`account_id`='+acIds.join(' OR `t`.`account_id`='); //I think it not important
    }
    var sql = 'SELECT SUM(`debit_equiv` - `credit_equiv`) as balance, trans_date '+
      'FROM ((SELECT `debit_equiv`, `credit_equiv`, `project_id`, `account_id`, `currency_id`, `trans_date` FROM `posting_journal`)'+
      ' UNION (SELECT `debit_equiv`, `credit_equiv`, `project_id`, `account_id`, `currency_id`, `trans_date` FROM `general_ledger`)) as `t`'+
      ' WHERE '+portion+' AND `t`.`project_id`='+sanitize.escape(project_id)+' GROUP BY `trans_date` LIMIT 20;';
    db.execute(sql, function(err, ans){
      if (err) { return callback(err); }
      return callback(null, ans);
    });
  }

  function pcRI (project_id, request, callback){
    var query = JSON.parse(request);
    var acIds = query.accounts.map(function(item){
      return sanitize.escape(item);
    });
    var portion = '';
    if (acIds.length === 1){
      portion = '`t`.`account_id`='+acIds[0];
    }else{
      portion = '`t`.`account_id`='+acIds.join(' OR `t`.`account_id`='); //I think it not important
    }
    var sql = 'SELECT SUM(`debit_equiv`) as total, trans_date '+
      'FROM ((SELECT `debit_equiv`, `credit_equiv`, `project_id`, `account_id`, `currency_id`, `trans_date` FROM `posting_journal`)'+
      ' UNION (SELECT `debit_equiv`, `credit_equiv`, `project_id`, `account_id`, `currency_id`, `trans_date` FROM `general_ledger`)) as `t`'+
      ' WHERE '+portion+' AND `t`.`project_id`='+sanitize.escape(project_id)+' GROUP BY `trans_date` LIMIT 20;';
    db.execute(sql, function(err, ans) {
      if (err) { return callback(err); }
      return callback(null, ans);
    });
  }

  function ccc (project_id, request, callback){
    var ids = request.accounts.map(function (account) {
      return account.id;
    });

    var sql =
      'SELECT SUM(`debit_equiv`) as debit, SUM(`credit_equiv`) as credit, service_id '+
      'FROM ((SELECT `debit_equiv`, `credit_equiv`, `project_id`, `account_id`, `service_id` FROM `posting_journal`)'+
      ' UNION (SELECT `debit_equiv`, `credit_equiv`, `project_id`, `account_id`, `service_id` FROM `general_ledger`)) as `t` LEFT JOIN `service` ON `service`.`id` = `t`.`service_id`'+
      ' WHERE `t`.`project_id`='+sanitize.escape(project_id)+' AND `t`.`account_id` IN ('+ids.join(',')+') AND (`t`.`service_id` IS NULL OR `service`.`cost_center_id`='+sanitize.escape(request.cc_id)+') GROUP BY `t`.`account_id`';

    db.execute(sql, function(err, ans){
      if (err) { return callback(err); }
      console.log('les resultats a retourner', ans);
      return callback(null, ans);
    });
  }

  function sp (project_id, request, callback){
    var sql =
      'SELECT SUM(`debit_equiv`) as debit, SUM(`credit_equiv`) as credit, service_id, account_number '+
      'FROM ((SELECT `debit_equiv`, `credit_equiv`, `project_id`, `account_id`, `service_id` FROM `posting_journal`)'+
      ' UNION (SELECT `debit_equiv`, `credit_equiv`, `project_id`, `account_id`, `service_id` FROM `general_ledger`)) as `t` JOIN `account` ON `account`.`id`=`t`.`account_id` JOIN `service` ON `service`.`id` = `t`.`service_id`'+
      ' WHERE `t`.`project_id`='+sanitize.escape(project_id)+' AND `t`.`service_id`='+sanitize.escape(request.service_id)+' GROUP BY `t`.`account_id`';

    db.execute(sql, function(err, ans){
      if (err) { return callback(err); }
      ans = ans.filter(function (item) {
        return item.account_number.toString().indexOf('7') === 0;
      });
      return callback(null, ans);
    });
  }

  return function menu (goal, project_id, request, callback) {
    return menuMap[goal] ? menuMap[goal](project_id, request, callback) :  new Error('Incorrect/invalid route');
  };
};
