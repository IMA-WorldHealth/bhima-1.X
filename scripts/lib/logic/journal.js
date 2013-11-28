 //at left posting_journal property, at right service property such as sale, cash, purchase_order : map
var db = require('../database/db')()
  , util = require('../util/util.js')
  , Q = require('q');

var map = {
  'sale':{'t':'sale', 'enterprise_id':'enterprise_id', 'trans_id':'id', 'currency_id':'currency_id', 'deb_cred_id':'debitor_id', 'trans_date':'invoice_date', 'description':'note'/*,'fyearID':'fyearID'*/, 'debit':'cost'},
  'sale_debit':{'enterprise_id':'enterprise_id', 'trans_id':'id', 'currency_id':'currency_id', 'deb_cred_id':'debitor_id', 'trans_date':'invoice_date', 'description':'note'/*,'fyearID':'fyearID'*/, 'debit':'cost', 'inv_po_id':'id'},
  'sale_credit':{'enterprise_id':'enterprise_id', 'trans_id':'id', 'currency_id':'currency_id', 'trans_date':'invoice_date', 'description':'note'/*,'fiscal_year_idyearID':'fyearID',*/, 'inv_po_id':'id', 'credit':'total'},
  'cash':{'t':'cash', 'enterprise_id':'enterprise_id', 'trans_id':'id', 'currency_id':'currency_id', 'trans_date':'date', 'description':'text', 'inv_po_id':'invoice_id', 'debit':'amount', 'credit':'amount'},
  'cash_debit':{'enterprise_id':'enterprise_id', 'trans_id':'id', 'currency_id':'currency_id', 'trans_date':'date', 'description':'text', 'inv_po_id':'invoice_id', 'debit':'amount'/*, 'account_id':'debit_account'*/},
  'cash_credit':{'enterprise_id':'enterprise_id', 'trans_id':'id', 'currency_id':'currency_id', 'trans_date':'date', 'description':'text', 'inv_po_id':'invoice_id', 'credit':'amount'}, 
  'purchase':{'t':'purchase', 'trans_id':'id','enterprise_id':'enterprise_id','credit':'cost','currency_id':'currency_id','deb_cred_id':'creditor_id','trans_date':'invoice_date','description':'note'},
  'purchase_debit': {'enterprise_id':'enterprise_id', 'trans_id':'id', 'currency_id':'currency_id', 'trans_date':'invoice_date', 'description':'note'/*,'fyearID':'fyearID',*/, 'doc_num':'id', 'debit':'total'},
  'purchase_credit':{'enterprise_id':'enterprise_id', 'trans_id':'id', 'currency_id':'currency_id', 'deb_cred_id':'creditor_id', 'trans_date':'invoice_date', 'description':'note'/*,'fyearID':'fyearID'*/, 'credit':'cost', 'doc_num':'id'}
};
var service_name = '', opDibitState, opCreditState;

exports.poster = function(req, res) {
  opDibitState = false; opCreditState = false;
  var callback = function (err, record) {
    console.log("catch the error: ", err, record);
    if (record.length < 1) {
      insert(req.body, res);    
    }
  };

  for(var i = 0; i<req.body.length; i++){
      var sql = {
                  'entities' : [{'t':'posting_journal', 'c':['id']}],
                  'cond' : [{'t':'posting_journal', 'cl':'trans_id', 'z':'=', 'v':req.body[i].id, l:'AND'}, {'t':'posting_journal', 'cl':'origin_id', 'z':'=', 'v':req.body[i].transaction_type}]
            };
      db.execute(db.select(sql), callback);
  }  
};

// FIXME Temporary fix, pass a reference to res through to process - this should be done with a callback/ promise
var insert = function(obj,res){  
  for(var i = 0; i<obj.length; i++){
      getData(obj[i], res);      
  } 
};

var saleDebit = function (obj, data, posting, res, periodExerciceIdObject){ 
  var deffer = Q.defer(); 
  var journalRecord = {};
  var objDebit = map[obj.t+'_debit'];
  for(var cle in objDebit){
    journalRecord[cle] = data[objDebit[cle]];
  }
  //  journalRecord.posted = 0;
  journalRecord.origin_id = posting.transaction_type; //this value wil be fetched in posting object
  journalRecord.user_id = posting.user;
  journalRecord.id = '';
  journalRecord.trans_date = util.convertToMysqlDate(journalRecord.trans_date);
  journalRecord.fiscal_year_id = periodExerciceIdObject.fid;
  journalRecord.period_id = periodExerciceIdObject.pid;
  var callback = function (err, ans) {    
    if (err){
      deffer.resolve({succes :false, info:err});
    }else{
    deffer.resolve({succes:true, info:ans});
    }    
  };
  var sql = {
             'entities':[{'t':'debitor', 'c':['group_id']}],
             'cond':[{'t':'debitor', 'cl':'id', 'z':'=', 'v':journalRecord.deb_cred_id}]
            };
  var req = db.select(sql);
  db.execute(req, function(err, data){
    var sql = {
     'entities':[{'t':'debitor_group', 'c':['account_number']}],
     'cond':[{'t':'debitor_group', 'cl':'id', 'z':'=', 'v':data[0].group_id}]
    };
    db.execute(db.select(sql), function(err, data2){
      if (err) throw err;
      var sql = {
                  'entities':[{'t':'account', 'c':['id']}],
                  'cond':[{'t':'account', 'cl':'account_number', 'z':'=', 'v':data2[0].account_number, 'l':'AND'},
                          {'t':'account', 'cl':'enterprise_id', 'z':'=', 'v':journalRecord.enterprise_id}
                         ]
                };
      db.execute(db.select(sql), function(err, data3){
        journalRecord.account_id = data3[0].id;
        var sql = db.insert('posting_journal', [journalRecord]);
        db.execute(sql, callback);

      }); 
    });
  });
  return deffer.promise;
};

var saleCredit = function(obj, data, posting, res, periodExerciceIdObject){ 
  var deffer = Q.defer();  
  var objCredit = map[obj.t+'_credit'];
  var callback = function (err, ans) {    
    if (err) {
      deffer.resolve({succes :false, info:err});
    } else {
      deffer.resolve({succes:true, info:ans});
    } 
  };
  data.forEach(function(item){
    var journalRecord = {}; 
    var sql = {
               'entities':[{'t':'inv_group', 'c':['sales_account']}],
               'cond':[{'t':'inv_group', 'cl':'id', 'z':'=', 'v':item.group_id}]
    };
    db.execute(db.select(sql), function(err, data2){      
      journalRecord.account_id = data2[0].sales_account;
      for(var cle in objCredit){
      journalRecord[cle] = item[objCredit[cle]];    
      }
    //      journalRecord.posted = 0;
      journalRecord.origin_id = posting.transaction_type;
      journalRecord.user_id = posting.user;
      journalRecord.id = '';
      journalRecord.trans_date = util.convertToMysqlDate(journalRecord.trans_date);
      journalRecord.fiscal_year_id = periodExerciceIdObject.fid;
      journalRecord.period_id = periodExerciceIdObject.pid;
      var sql = db.insert('posting_journal', [journalRecord]); 
      db.execute(sql, callback);      
    });
  });
  return deffer.promise;
}

var cashDebit = function (obj, data, posting, res, periodExerciceIdObject){
  var deffer = Q.defer(); 
  var callback = function (err, ans) {
    if (err){
      deffer.resolve({succes :false, info:err});
    }else{
    deffer.resolve({succes:true, info:ans});
    } 
  } 
  var journalRecord = {};
  var objDebit = map[obj.t+'_debit'];
  for(var cle in objDebit){
    journalRecord[cle] = data[0][objDebit[cle]];
  }
  //  journalRecord.posted = 0;
  journalRecord.origin_id = posting.transaction_type; //this value wil be fetched in posting object
  journalRecord.user_id = posting.user;
  journalRecord.id = '';
  journalRecord.trans_date = util.convertToMysqlDate(journalRecord.trans_date);
  journalRecord.fiscal_year_id = periodExerciceIdObject.fid;
  journalRecord.period_id = periodExerciceIdObject.pid;
  var sql = {
    'entities':[{'t':'cash', 'c':['debit_account']}],
    'cond':[{'t':'cash', 'cl':'id', 'z':'=', 'v':posting.id}]
  }
  db.execute(db.select(sql),function(err, data2){
    journalRecord.account_id = data2[0].debit_account;
    var sql = db.insert('posting_journal', [journalRecord]);
    db.execute(sql, callback); 
  });
  return deffer.promise;
}

var cashCredit = function (obj, data, posting, res, periodExerciceIdObject){
  var deffer = Q.defer(); 
  var callback = function (err, ans) {
    if (err){
      deffer.resolve({succes :false, info:err});
    }else{
      deffer.resolve({succes:true, info:ans});
    } 
  } 
  var journalRecord = {};
  var objCredit = map[obj.t+'_credit'];
  for(var cle in objCredit){
    journalRecord[cle] = data[0][objCredit[cle]];
  }
  journalRecord.posted = 0;
  journalRecord.origin_id = posting.transaction_type; //this value wil be fetched in posting object
  journalRecord.user_id = posting.user;
  journalRecord.id = '';
  journalRecord.trans_date = util.convertToMysqlDate(journalRecord.trans_date);
  journalRecord.fiscal_year_id = periodExerciceIdObject.fid;
  journalRecord.period_id = periodExerciceIdObject.pid;
  var sql = {
    'entities':[{'t':'cash', 'c':['credit_account']}],
    'cond':[{'t':'cash', 'cl':'id', 'z':'=', 'v':posting.id}]
  };
  db.execute(db.select(sql),function(err, data2){
    journalRecord.account_id = data2[0].credit_account;
    var sql = db.insert('posting_journal', [journalRecord]);
    db.execute(sql, callback); 
  });
  return deffer.promise;
};

var purchaseDebit = function(obj, data, posting, res){
  var deffer = Q.defer(); 
  var objDebit = map[obj.t+'_debit'];
  var callback = function (err, ans) {if (err){
      deffer.resolve({succes :false, info:err});
    }else{
    deffer.resolve({succes:true, info:ans});
    } 
  }
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
  //      journalRecord.posted = 0;
      journalRecord.origin_id = posting.transaction_type;
      journalRecord.user_id = posting.user;
      journalRecord.id = '';
      journalRecord.trans_date = util.convertToMysqlDate(journalRecord.trans_date);
      journalRecord.fiscal_year_id = periodExerciceIdObject.fid;
      journalRecord.period_id = periodExerciceIdObject.pid;
      var sql = db.insert('posting_journal', [journalRecord]); 
      db.execute(sql, callback);      
    });
  });
  return deffer.promise;
}

var purchaseCredit = function(obj, data, posting, res){
  var deffer = Q.defer(); 
  var journalRecord = {};
  var objCredit = map[obj.t+'_credit'];

  for(var cle in objCredit){
    journalRecord[cle] = data[objCredit[cle]];
  }
  //  journalRecord.posted = 0;
  journalRecord.origin_id = posting.transaction_type; //this value wil be fetched in posting object
  journalRecord.user_id = posting.user;
  journalRecord.id = '';
  journalRecord.trans_date = util.convertToMysqlDate(journalRecord.trans_date);
  journalRecord.fiscal_year_id = periodExerciceIdObject.fid;
  journalRecord.period_id = periodExerciceIdObject.pid;
  var callback = function (err, ans) {
    if (err){
      deffer.resolve({succes :false, info:err});
    }else{
    deffer.resolve({succes:true, info:ans});
    } 
  }  
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
  return deffer.promise;
}

var process = function(data, posting, res, periodExerciceIdObject){
  console.log('la period exercice id est :',periodExerciceIdObject);
  var obj = map[service_name];
  if(service_name == 'sale'){
    Q.all([saleDebit(obj, data[0], posting, res, periodExerciceIdObject), saleCredit(obj, data, posting, res, periodExerciceIdObject), check(obj.t, posting.id)]).then(function(arr) {
      console.log("Received, ", arr);
      if(arr[0].succes==true && arr[1].succes==true && arr[2] == true){
        res.send({status: 200, insertId: arr[1].info.insertId});
      }
    });
  }else if(service_name == 'cash'){ 
    Q.all([cashDebit(obj, data, posting, res, periodExerciceIdObject), cashCredit(obj, data, posting, res, periodExerciceIdObject), check(obj.t, posting.id)]).then(function(arr) {    
      if(arr[0].succes==true && arr[1].succes==true && arr[2] == true){
        res.send({status: 200, insertId: arr[1].info.insertId});
      }
    });
  }else if(service_name == 'purchase'){
    Q.all([purchaseDebit(obj, data, posting, res, periodExerciceIdObject), purchaseCredit(obj, data[0], posting, res, periodExerciceIdObject), check(obj.t, posting.id)]).then(function(arr) { 
      if(arr[0].succes == true && arr[1].succes == true && arr[2] == true){        
        res.send({status: 200, insertId: arr[1].info.insertId});
      }
    });
  }
}

var getData = function(posting, res){
  //each posting object contains transaction_id, service_id, user_id properties
  //request for knowing the service
  var sql = {
             'entities':[{'t':'transaction_type', 'c':['service_txt']}],
             'cond':[{'t':'transaction_type', 'cl':'id', 'z':'=', 'v':posting.transaction_type}]//posting.transaction_type
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
        Q.all([getPeriodExerciceId(data[0].invoice_date, data[0].enterprise_id)]).then(function(result){
          console.log('retour  a la fonction getData', result[0]);
          if(result[0].succes) process(data, posting, res, result[0]); //verification et insertion eventuelle
        });        
      });
    }else if(service_name == 'cash'){
      var sql = {
        'entities':[
                    {'t':obj.t, 'c':cle_tab}
                   ],        
        'cond' :   [
                    {'t':obj.t, 'cl':'id', 'z':'=', 'v':posting.id}//posting.id
                   ]
                };
      db.execute(db.select(sql), function(err, data){
      if(err) throw err;
          Q.all([getPeriodExerciceId(data[0].date, data[0].enterprise_id)]).then(function(result){
          console.log('retour  a la fonction getData', result[0]);
          if(result[0].succes) process(data, posting, res, result[0]); //verification et insertion eventuelle
        });
      });
    }else if(service_name == 'purchase'){
      var sql = {
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
      db.execute(db.select(sql), function(err, data){
      if(err) throw err;
        Q.all([getPeriodExerciceId(data[0].invoice_date, data[0].enterprise_id)]).then(function(result){
          console.log('retour  a la fonction getData', result[0]);
          if(result[0].succes) process(data, posting, res, result[0]); //verification et insertion eventuelle
        });
      });

    }
  });
}

var check = function(table, id){
  var deffer = Q.defer();
  db.execute(db.update(table, [{id:id, posted:1}], ["id"]), function(err, data){
    if(err){
      deffer.resolve(false);
    }else{
      deffer.resolve(true);
    }
  });
  return deffer.promise;
}

var getPeriodExerciceId = function(date, eid){
  console.log('les parametres sont date:', date, 'enterprise_id: ', eid);
  var deffer = Q.defer(); 
  var year = new Date(date).getFullYear();
  var mysqlDate = util.convertToMysqlDate(date);
  var sql = {'entities':[{'t':'fiscal_year', c:['id']}],
             'cond':[
                      {'t':'fiscal_year', 'cl':'start_year', 'z':'=','v':year, l:'AND'}, 
                      {'t':'fiscal_year', 'cl':'enterprise_id','z':'=', 'v':eid}
                    ]
            };
  db.execute(db.select(sql), function(err, data){
    if(err) res.send(500, {'msg':'some thing is bad'});
    console.log('on a lannee fiscal', data);
    if(data.length>=1){
      var sql = {'entities':[{'t':'period', c:['id']}],
                 'cond':[
                          {'t':'period', 'cl':'period_start', 'z':'<=','v':mysqlDate, l:'AND'},
                          {'t':'period', 'cl':'period_stop', 'z':'>=','v':mysqlDate, l:'AND'}, 
                          {'t':'period', 'cl':'fiscal_year_id','z':'=', 'v':data[0].id}
                        ]
                };
      db.execute(db.select(sql), function(err, data2){
      if(err) res.send(500, {'msg':'some thing is bad'});
        if(data2.length>=1){
          deffer.resolve({succes:true, fid:data[0].id, pid:data2[0].id});
        }else{
          deffer.resolve({succes:false});
        }
    });
    }else{
      deffer.resolve({succes:false});
    }
  });
  return deffer.promise;
}









