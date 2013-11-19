var db = require('../database/db')({config: {user: 'bika', database: 'bika', host: 'localhost', password: 'HISCongo2013'}})
  , util = require('../util/util.js');
var map = {
  'sale':{'t':'sale', 'enterprise_id':'enterprise_id', 'transID':'id', 'currency_id':'currency_id', 'arapAccount':'debitor_id', 'transDate':'invoice_date', 'description':'note','fyearID':'fyearID', 'debitAmount':'cost'},
  'sale_debit':{'enterpriseID':'enterprise_id', 'transID':'id', 'currency_id':'currency_id', 'arapAccount':'debitor_id', 'transDate':'invoice_date', 'description':'note'/*,'fyearID':'fyearID'*/, 'debitAmount':'cost', 'invPoNum':'id'},
  'sale_credit':{'enterpriseID':'enterprise_id', 'transID':'id', 'currency_id':'currency_id', 'transDate':'invoice_date', 'description':'note'/*,'fyearID':'fyearID', 'creditAmount':'total'*/, 'invPoNum':'id', 'creditAmount':'total'},

  'cash':{},
  'purchase_order':{}
}; //at left posting_journal property, at right service property such as sale, cash, purchase_order
var service_name = '';

exports.poster = function(req, res) {
  var callback = function (err, record) {
    if (record.length < 1) {
      insert(req.body, res);    
    }
  } 
  for(var i = 0; i<req.body.length; i++){
      var sql = {
                  'entities' : [{'t':'posting_journal', 'c':['id']}],
                  'cond' : [{'t':'posting_journal', 'cl':'transID', 'z':'=', 'v':req.body[i].id, l:'AND'}, {'t':'posting_journal', 'cl':'origin_id', 'z':'=', 'v':req.body[i].transaction_type}]
            };
      db.execute(db.select(sql), callback);
  }  
}

// FIXME Temporary fix, pass a reference to res through to process - this should be done with a callback/ promise
var insert = function(obj,res){  
  for(var i = 0; i<obj.length; i++){
      getData(obj[i], res);      
  } 
}

var saleDebit = function (obj, data, posting){

  var journalRecord = {};
  var objDebit = map[obj.t+'_debit'];

  for(var cle in objDebit){
    journalRecord[cle] = data[objDebit[cle]];
  }
  journalRecord.posted = 0;
  journalRecord.origin_id = posting.transaction_type; //this value wil be fetched in posting object
  journalRecord.user_id = posting.user;
  journalRecord.id = '';
  journalRecord.transDate = util.convertToMysqlDate(journalRecord.transDate);
  console.log('data :',data);
  var callback = function (err, ans) {
        if (err) throw err;
        //res.send({status: 200, insertId: ans.insertId});
  }  
  var sql = {
             'entities':[{'t':'debitor', 'c':['group_id']}],
             'cond':[{'t':'debitor', 'cl':'id', 'z':'=', 'v':journalRecord.arapAccount}]
            };
  var req = db.select(sql);
  db.execute(req, function(err, data){
    var sql = {
     'entities':[{'t':'debitor_group', 'c':['account_number']}],
     'cond':[{'t':'debitor_group', 'cl':'id', 'z':'=', 'v':data[0].group_id}]
    };
    db.execute(db.select(sql), function(err, data){
      journalRecord.account_id = data[0].account_number;
      var sql = db.insert('posting_journal', [journalRecord]);
      db.execute(sql, callback); 
    });
  });
}

var saleCredit = function(obj, data, posting){ 
  var journalRecord = {};  
  var objCredit = map[obj.t+'_credit'];
  var callback = function (err, ans) {
        if (err) throw err;
        //res.send({status: 200, insertId: ans.insertId});
  }
  for(var i=0; i<data.length; i++){
    for(var cle in objCredit){
      journalRecord[cle] = data[i][objCredit[cle]];
    }
    journalRecord.posted = 0;
    journalRecord.origin_id = posting.transaction_type;
    journalRecord.user_id = posting.user;
    journalRecord.id = '';
    journalRecord.transDate = util.convertToMysqlDate(journalRecord.transDate);
    var sql = {
               'entities':[{'t':'inv_group', 'c':['sales_account']}],
               'cond':[{'t':'inv_group', 'cl':'id', 'z':'=', 'v':data[i].group_id}]
    };
    var req = db.select(sql);
    db.execute(req, function(err, data2){
      journalRecord.account_id = data2[0].sales_account;
      var sql = db.insert('posting_journal', [journalRecord]);
      db.execute(sql, callback);      
    });
  }
}

var process = function(data, posting, res){
  var obj = map[service_name];
  if(service_name == 'sale'){
    saleDebit(obj, data[0], posting);
    saleCredit(obj, data, posting);
  }else if(service_name == 'cash'){
  }
}

var getData = function(posting, res){

  //each posting object contains transaction_id, service_id, user_id properties
  //request for knowing the service
  var sql = {
             'entities':[{'t':'transaction_type', 'c':['service_txt']}],
             'cond':[{'t':'transaction_type', 'cl':'id', 'z':'=', 'v':posting.transaction_type}]

            };
  db.execute(db.select(sql), function(err, data){
    service_name = data[0].service_txt.toLowerCase();
    var obj = map[service_name];
    var cle_tab = [];
    for (var cle in obj){
      if(cle!='t'){
        cle_tab.push(obj[cle]);
      }
    }

    if(service_name == 'sale'){
      var sql = {
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
      db.execute(db.select(sql), function(err, data){
      if(err) throw err;
      process(data, posting, res); //verification et insertion eventuelle
    });
      }   
  });
}







