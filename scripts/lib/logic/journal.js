 //at left posting_journal property, at right service property such as sale, cash, purchase_order : map
var util = require('../util/util'),
    Q = require('q');

var map = {
  'sale':{'t':'sale', 'enterprise_id':'enterprise_id', 'trans_id':'id', 'currency_id':'currency_id', 'deb_cred_id':'debitor_id', 'trans_date':'invoice_date', 'description':'note', 'debit':'cost'},
  'sale_debit':{'enterprise_id':'enterprise_id', 'trans_id':'id', 'currency_id':'currency_id', 'deb_cred_id':'debitor_id', 'trans_date':'invoice_date', 'description':'note', 'debit': 'cost', 'inv_po_id':'id'},
  'sale_credit':{'enterprise_id':'enterprise_id', 'trans_id':'id', 'currency_id':'currency_id','deb_cred_id':'debitor_id', 'trans_date':'invoice_date', 'description':'note','inv_po_id':'id', 'credit':'total'},
  'cash':{'t':'cash', 'enterprise_id':'enterprise_id', 'trans_id':'id','deb_cred_id':'deb_cred_id', 'currency_id':'currency_id', 'trans_date':'date', 'description':'text', 'debit':'cost'},
  'cash_debit':{'enterprise_id':'enterprise_id', 'trans_id':'id','deb_cred_id':'deb_cred_id', 'currency_id':'currency_id', 'trans_date':'date', 'description':'text', 'inv_po_id':'invoice_id', 'debit':'cost', 'doc_num':'id'},
  'cash_credit':{'enterprise_id':'enterprise_id','deb_cred_id':'deb_cred_id', 'trans_id':'id', 'currency_id':'currency_id', 'trans_date':'date', 'description':'text', 'inv_po_id':'invoice_id', 'credit':'allocated_cost'}, 
  'purchase':{'t':'purchase', 'trans_id':'id','enterprise_id':'enterprise_id','credit':'cost','currency_id':'currency_id','deb_cred_id':'creditor_id','trans_date':'invoice_date','description':'note'},
  'purchase_debit': {'enterprise_id':'enterprise_id', 'trans_id':'id', 'currency_id':'currency_id','deb_cred_id':'creditor_id', 'trans_date':'invoice_date', 'description':'note'/*,'fyearID':'fyearID',*/, 'doc_num':'id', 'debit':'total'},
  'purchase_credit':{'enterprise_id':'enterprise_id', 'trans_id':'id', 'currency_id':'currency_id', 'deb_cred_id':'creditor_id', 'trans_date':'invoice_date', 'description':'note'/*,'fyearID':'fyearID'*/, 'credit':'cost', 'doc_num':'id'}
};

module.exports = function (db) {
  'use strict';
  var service_name = '';
  var self = {};

  self.poster = function (req, res, next) { 
    req.body.forEach(function (item) {
      var sql = "SELECT `id` FROM `posting_journal` WHERE `trans_id`=" + db.escapestr(item.id) + " AND `origin_id`=" + db.escapestr(item.transaction_type) + ";\n";
      /*
      var sql = {
                    'entities' : [{'t':'posting_journal', 'c':['id']}],
                    'cond' : [{'t':'posting_journal', 'cl':'trans_id', 'z':'=', 'v':item.id, l:'AND'}, {'t':'posting_journal', 'cl':'origin_id', 'z':'=', 'v':item.transaction_type}]
              };
      */
      db.execute(sql, function(err, records) {
        if (err) next(err);
        if (!records.length) getData(item, res);
      });
    }); 
  };

  function getData (posting, res) {
    //each posting object contains transaction_id, service_id, user_id properties
    //request for knowing the service
    /*
    var sql = {
               'entities':[{'t':'transaction_type', 'c':['service_txt']}],
               'cond':[{'t':'transaction_type', 'cl':'id', 'z':'=', 'v':posting.transaction_type}]//posting.transaction_type
              };
    */
    var query = "SELECT DISTINCT `service_txt` FROM `transaction_type` WHERE `id`=" + db.escapestr(posting.transaction_type) + ';\n';
    db.execute(query, function (err, data) {
      var columnData, sql, service_name,
          columns = [],
          defer = Q.defer();

      service_name = data[0].service_txt.toLowerCase();
      columnData = map[service_name];
      for (var col in columnData) {
        if (col !='t') columns.push('`' + columnData.t + '`.`' + columnData[col] + '`');
      }

      switch (service_name) {
        case 'sale' : 
          sql = "SELECT " + columns.join(', ') + ", `inventory_id`, `total`, `group_id` FROM " + columnData.t + " JOIN `sale_item` JOIN `inventory` ON `sale`.`id`=`sale_item`.`sale_id` AND `sale_item`.`inventory_id`=`inventory`.`id` WHERE " + columnData.t + ".`id`=" + posting.id + ";\n";
          /*
          sql = {
            'entities':[
                        {'t':obj.t, 'c':cle_tab},
                        {'t':'sale_item', 'c':['inventory_id', 'total']},
                        {'t':'inventory', 'c':['group_id']}
                       ],
            'jcond':   [
                        {ts: ['sale', 'sale_item'], c: ['id', 'sale_id'],l: 'AND'},
                        {ts: ['inventory', 'sale_item'], c: ['id', 'inventory_id'],l: 'AND'}
                       ],
            'cond' :   [
                        {'t':obj.t, 'cl':'id', 'z':'=', 'v':posting.id}
                       ]
                    };
          */
          db.execute(sql, function (err, data) {
            if (err) throw err;
            defer.resolve(data);
          });
          break;
       case 'cash' :
         sql = "SELECT " + columns.join(', ') + ", `cash_id`, `allocated_cost`, `invoice_id` FROM " + columnData.t + " JOIN `cash_item` ON `cash`.`id`=`cash_item`.`cash_id` WHERE " + columnData.t + ".`id`=" + db.escapestr(posting.id) + ";\n";
         /*
         sql = {
           'entities':[
                       {'t':obj.t, 'c':cle_tab},
                       {'t':'cash_item', 'c':['cash_id', 'allocated_cost', 'invoice_id']}
                      ],
           'jcond':   [
                       {'ts':['cash', 'cash_item'], 'c':['id', 'cash_id'], l:'AND'}
                      ],     
           'cond' :   [
                       {'t':obj.t, 'cl':'id', 'z':'=', 'v':posting.id},
                      ]
                   };
         */
         db.execute(sql, function(err, data) {
           if (err) throw err; // collapse this into a promise..
           defer.resolve(data);
         });
         break;
        case 'purchase': 
          sql = "SELECT " + columns.join(', ') + ", `inventory_id`, `total`, `group_id` FROM `purchase` JOIN `purchase_item` JOIN `inventory` ON `purchase`.`id`=`purchase_id`.`purchase_id` AND `purchase_item`.`inventory_id`=`inventory`.`id` WHERE " + columnData.t +".`id`=" + db.escapestr(posting.id) + ";\n";
          /*
          sql = {
            'entities':[
                        {'t':obj.t, 'c':cle_tab},
                        {'t':'purchase_item', 'c':['inventory_id', 'total']},
                        {'t':'inventory', 'c':['group_id']}
                       ],
            'jcond':   [
                        {ts: ['purchase', 'purchase_item'], c: ['id', 'purchase_id'],l: 'AND'},
                        {ts: ['inventory', 'purchase_item'], c: ['id', 'inventory_id'],l: 'AND'}
                       ],
            'cond' :   [
                        {'t':obj.t, 'cl':'id', 'z':'=', 'v':posting.id}
                       ]
                    };
          */
          db.execute(sql, function(err, data){
          if (err) throw err;
            defer.resolve(data);
          });
      }

      defer.promise
      .then(function (data) {
        Q.all([getPeriodExerciceId(data[0].invoice_date, data[0].enterprise_id)])
        .then(function (result) {
          if (result[0].success) process(data, posting, res, result[0], service_name); //verification et insertion eventuelle
        });
      });

    });
  }

  function saleDebit (obj, data, posting, res, periodExerciceIdObject) {
    var defer = Q.defer(),
        journalRecord = {},
        debitColumns = map[obj.t + '_debit'];

    for (var k in debitColumns) journalRecord[k] = data[debitColumns[k]];

    journalRecord.origin_id = posting.transaction_type; //this value wil be fetched in posting object
    journalRecord.user_id = posting.user;
    journalRecord.id = '';
    //FIXME: This code is deprecated.  Actually do this properly using a post from the client.
    journalRecord.deb_cred_type = 'D'; // TODO/FIXME
    journalRecord.trans_date = util.convertToMysqlDate(journalRecord.trans_date);
    journalRecord.fiscal_year_id = periodExerciceIdObject.fid;
    journalRecord.period_id = periodExerciceIdObject.pid;

    /*
    var sql = {
               'entities':[{'t':'debitor', 'c':['group_id']}],
               'cond':[{'t':'debitor', 'cl':'id', 'z':'=', 'v':journalRecord.deb_cred_id}]
              };
    */
    var req = "SELECT `group_id` FROM `debitor` WHERE `debitor`.`id`=" + db.escapestr(journalRecord.deb_cred_id) + ";\n";
//    var req = db.select(sql);
    db.execute(req, function (err, rows) {
      if (err) throw err;
      var sql = "SELECT `debitor_group`.`account_id` FROM `debitor_group` WHERE `debitor_group`.`id`=" + rows[0].group_id + ";\n";
      /*
      var sql = {
       'entities':[{'t':'debitor_group', 'c':['account_id']}],
       'cond':[{'t':'debitor_group', 'cl':'id', 'z':'=', 'v':data[0].group_id}]
      };
     */

      db.execute(sql, function (err, results) {
        if (err) throw err;
        journalRecord.account_id = results[0].account_id;
        var sql = db.insert('posting_journal', [journalRecord]);
        db.execute(sql, function (error, ans) {
          defer.resolve( error ? {success: false, info: error} : {success: true, info: ans});
        });
      });
    });

    return defer.promise;
  }

  function saleCredit (obj, data, posting, res, periodExerciceIdObject) { 
    var defer = Q.defer();  
    var objCredit = map[obj.t+'_credit'];
    var callback = function (err, ans) {    
      if (err) {
        defer.resolve({success :false, info:err});
      } else {
        defer.resolve({success:true, info:ans});
      } 
    };
    data.forEach(function(item){
      var journalRecord = {}; 
      var sql = {
        'entities':[{'t':'inv_group', 'c':['sales_account']}],
        'cond':[{'t':'inv_group', 'cl':'id', 'z':'=', 'v':item.group_id}]
      };
      db.execute(db.select(sql), function(err, data2){       
          for(var cle in objCredit){
            journalRecord[cle] = item[objCredit[cle]];    
          }
          journalRecord.origin_id = posting.transaction_type;
          journalRecord.user_id = posting.user;
          journalRecord.id = '';
          journalRecord.deb_cred_type = 'D'; 
          journalRecord.trans_date = util.convertToMysqlDate(journalRecord.trans_date);
          journalRecord.fiscal_year_id = periodExerciceIdObject.fid;
          journalRecord.period_id = periodExerciceIdObject.pid;
          journalRecord.account_id = data2[0].sales_account;
          var sql = db.insert('posting_journal', [journalRecord]); 
          db.execute(sql, callback);           
      });
    });
    return defer.promise;
  }

  var cashDebit = function (obj, data, posting, res, periodExerciceIdObject){
    var defer = Q.defer();
    var journalRecord = {};
    var objDebit = map[obj.t+'_debit']; 
    journalRecord.id = '';
    for(var cle in objDebit){
      journalRecord[cle] = data[0][objDebit[cle]];
    }
    journalRecord.origin_id = posting.transaction_type; //this value wil be fetched in posting object
    journalRecord.user_id = posting.user;
    journalRecord.deb_cred_type = 'D';  
    delete(journalRecord.description);
    journalRecord.trans_date = util.convertToMysqlDate(journalRecord.trans_date);
    journalRecord.fiscal_year_id = periodExerciceIdObject.fid;
    journalRecord.period_id = periodExerciceIdObject.pid;
    var sql = {
      'entities':[{'t':'cash', 'c':['debit_account']}],
      'cond':[{'t':'cash', 'cl':'id', 'z':'=', 'v':posting.id}]
    };
    db.execute(db.select(sql),function(err, record){

      console.log("SQL1! ", err, record);
      journalRecord.account_id = record[0].debit_account;
      var sql = db.insert('posting_journal', [journalRecord]);
      console.log('ligne debit ', journalRecord);
      db.execute(sql, function (err, ans) {
        console.log("SQL2! ", err, ans);
        if (err){
          defer.resolve({success :false, info:err});
        }else{
        defer.resolve({success:true, info:ans});
        } 
      });
    });
    return defer.promise;
  };

  var cashCredit = function (obj, data, posting, res, periodExerciceIdObject){
    var defer = Q.defer();   
    var objCredit = map[obj.t+'_credit'];
    var journalRecord = {};
    journalRecord.id = '';
    var sql = {
                'entities':[{'t':'cash', 'c':['credit_account']}],
                'cond':[{'t':'cash', 'cl':'id', 'z':'=', 'v':posting.id}]
              };
    db.execute(db.select(sql),function(err, data2){     
      journalRecord.account_id = data2[0].credit_account;
      data.forEach(function(item){    
        for(var cle in objCredit){
          journalRecord[cle] = item[objCredit[cle]];    
        }
        journalRecord.origin_id = posting.transaction_type;
        journalRecord.user_id = posting.user;
        journalRecord.deb_cred_type = 'D';
        delete(journalRecord.description);
        journalRecord.trans_date = util.convertToMysqlDate(journalRecord.trans_date);
        journalRecord.fiscal_year_id = periodExerciceIdObject.fid;
        journalRecord.period_id = periodExerciceIdObject.pid;
        var sql = db.insert('posting_journal', [journalRecord]); 
        console.log('ligne credit ', journalRecord);
        db.execute(sql, function (err, ans) {
          if (err){
            defer.resolve({success :false, info:err});
          }else{
            defer.resolve({success:true, info:ans});
          } 
        });
      });  
    });
    return defer.promise;
  };

  var purchaseDebit = function(obj, data, posting, res, periodExerciceIdObject){
    var defer = Q.defer(); 
    var objDebit = map[obj.t+'_debit'];
    var callback = function (err, ans) {
      if (err) defer.resolve({success :false, info:err});
      else defer.resolve({success:true, info:ans});
    };

    data.forEach(function(item){
      var journalRecord = {}; 
      var sql = {
                 'entities':[{'t':'inv_group', 'c':['sales_account']}],
                 'cond':[{'t':'inv_group', 'cl':'id', 'z':'=', 'v':item.group_id}]
      };
      db.execute(db.select(sql), function(err, data2){
         journalRecord.account_id = data2[0].sales_account;
          for(var cle in objDebit){
          journalRecord[cle] = item[objDebit[cle]];    
          }
        journalRecord.origin_id = posting.transaction_type;
        journalRecord.user_id = posting.user;
        journalRecord.deb_cred_type = 'C'; 
        journalRecord.id = '';
        journalRecord.trans_date = util.convertToMysqlDate(journalRecord.trans_date);
        journalRecord.fiscal_year_id = periodExerciceIdObject.fid;
        journalRecord.period_id = periodExerciceIdObject.pid;
        var sql = db.insert('posting_journal', [journalRecord]); 
        db.execute(sql, callback);
              
      });
    });
    return defer.promise;
  };

  var purchaseCredit = function(obj, data, posting, res, periodExerciceIdObject){
    var defer = Q.defer(); 
    var journalRecord = {};
    var objCredit = map[obj.t+'_credit'];

    for(var cle in objCredit){
      journalRecord[cle] = data[objCredit[cle]];
    }
    journalRecord.origin_id = posting.transaction_type; //this value wil be fetched in posting object
    journalRecord.user_id = posting.user;
    journalRecord.id = '';
    journalRecord.deb_cred_type = 'C'; // TODO/FIXME
    journalRecord.trans_date = util.convertToMysqlDate(journalRecord.trans_date);
    journalRecord.fiscal_year_id = periodExerciceIdObject.fid;
    journalRecord.period_id = periodExerciceIdObject.pid;
    var callback = function (err, ans) {
      if (err){
        defer.resolve({success :false, info:err});
      }else{
      defer.resolve({success:true, info:ans});
      } 
    };  
    var sql = {
               'entities':[{'t':'creditor', 'c':['creditor_group_id']}],
               'cond':[{'t':'creditor', 'cl':'id', 'z':'=', 'v':journalRecord.deb_cred_id}]
              };
    var req = db.select(sql);
    db.execute(req, function(err, data){
      var sql = {
       'entities':[{'t':'creditor_group', 'c':['account_id']}],
       'cond':[{'t':'creditor_group', 'cl':'id', 'z':'=', 'v':data[0].creditor_group_id}]
      };
      db.execute(db.select(sql), function(err, data){
        journalRecord.account_id = data[0].account_id;      
        var sql = db.insert('posting_journal', [journalRecord]);
        db.execute(sql, callback); 
      });
    });
    return defer.promise;
  };

  function process (data, posting, res, periodExerciceIdObject, service_name) {
    var obj = map[service_name];
    
    switch (service_name) {
      case 'sale' :
        Q.all([saleDebit(obj, data[0], posting, res, periodExerciceIdObject), saleCredit(obj, data, posting, res, periodExerciceIdObject), check(obj.t, posting.id)]).then(function(arr) {
          if(arr[0].success===true && arr[1].success===true && arr[2] === true){
            res.send({status: 200, insertId: arr[1].info.insertId});
          }
        });
        break;
      case 'cash' :
        Q.all([cashDebit(obj, data, posting, res, periodExerciceIdObject), cashCredit(obj, data, posting, res, periodExerciceIdObject)]).then(function(arr) {    
          if(arr[0].success===true && arr[1].success===true){
            console.log('******************* on a gagne ***********************');
            res.send({status: 200, insertId: arr[1].info.insertId});
          } else {
            console.log("Something wrong: ", arr);
          }
        });
        break;
      case 'purchase' :
        Q.all([purchaseDebit(obj, data, posting, res, periodExerciceIdObject), purchaseCredit(obj, data[0], posting, res, periodExerciceIdObject), check(obj.t, posting.id)]).then(function(arr) { 
          if(arr[0].success === true && arr[1].success === true && arr[2] === true){        
            res.send({status: 200, insertId: arr[1].info.insertId});
          }
        });
        break;
    }
  }


  function check (table, id) {
    var defer = Q.defer();
    db.execute(db.update(table, [{id: id, posted: 1}], ["id"]), function (err, data) {
      defer.resolve(err ? false : true);
    });
    return defer.promise;
  }

  function getPeriodExerciceId (date, eid) {
    var defer = Q.defer();
    var mysqlDate = db.escapestr(util.convertToMysqlDate(date));
    var sql = "SELECT `period`.`id`, `fiscal_year_id` FROM `period` WHERE `period`.`period_start`<=" + mysqlDate + " AND `period`.`period_stop`>=" + mysqlDate + ";\n";
    /*
    var sql = {'entities':[{'t':'period', c:['id', 'fiscal_year_id']}],
               'cond':[
                        {'t':'period', 'cl':'period_start', 'z':'<=','v':mysqlDate, l:'AND'},
                        {'t':'period', 'cl':'period_stop', 'z':'>=','v':mysqlDate}
                      ]
              };
    */
    db.execute(sql, function(err, data) {
        if (err) throw err;
        defer.resolve(data.length ? {success:true, fid:data[0].fiscal_year_id, pid:data[0].id} : {success : false});
    });
    return defer.promise;
  }

  return self;

};
