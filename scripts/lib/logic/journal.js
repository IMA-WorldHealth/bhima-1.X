 //at left posting_journal property, at right service property such as sale, cash, purchase_order : map
var db = require('../database/db')()
  , util = require('../util/util')
  , Q = require('q');

var map = {
  'sale':{'t':'sale', 'enterprise_id':'enterprise_id', 'trans_id':'id', 'currency_id':'currency_id', 'deb_cred_id':'debitor_id', 'trans_date':'invoice_date', 'description':'note', 'debit':'cost'},
  'sale_debit':{'enterprise_id':'enterprise_id', 'trans_id':'id', 'currency_id':'currency_id', 'deb_cred_id':'debitor_id', 'trans_date':'invoice_date', 'description':'note', 'debit':'cost', 'inv_po_id':'id'},
  'sale_credit':{'enterprise_id':'enterprise_id', 'trans_id':'id', 'currency_id':'currency_id', 'trans_date':'invoice_date', 'description':'note','inv_po_id':'id', 'credit':'total'},
  'cash':{'t':'cash', 'enterprise_id':'enterprise_id', 'trans_id':'id','deb_cred_id':'deb_cred_id', 'currency_id':'currency_id', 'trans_date':'date', 'description':'text', 'debit':'cost'},
  'cash_debit':{'enterprise_id':'enterprise_id', 'trans_id':'id', 'currency_id':'currency_id', 'trans_date':'date', 'description':'text', 'inv_po_id':'invoice_id', 'debit':'cost', 'doc_num':'id'},
  'cash_credit':{'enterprise_id':'enterprise_id','deb_cred_id':'deb_cred_id', 'trans_id':'id', 'currency_id':'currency_id', 'trans_date':'date', 'description':'text', 'inv_po_id':'invoice_id', 'credit':'allocated_cost'}, 
  'purchase':{'t':'purchase', 'trans_id':'id','enterprise_id':'enterprise_id','credit':'cost','currency_id':'currency_id','deb_cred_id':'creditor_id','trans_date':'invoice_date','description':'note'},
  'purchase_debit': {'enterprise_id':'enterprise_id', 'trans_id':'id', 'currency_id':'currency_id', 'trans_date':'invoice_date', 'description':'note'/*,'fyearID':'fyearID',*/, 'doc_num':'id', 'debit':'total'},
  'purchase_credit':{'enterprise_id':'enterprise_id', 'trans_id':'id', 'currency_id':'currency_id', 'deb_cred_id':'creditor_id', 'trans_date':'invoice_date', 'description':'note'/*,'fyearID':'fyearID'*/, 'credit':'cost', 'doc_num':'id'}
};

var service_name = '';

exports.poster = function(req, res) { 
  req.body.forEach(function(item){
    var sql = {
                  'entities' : [{'t':'posting_journal', 'c':['id']}],
                  'cond' : [{'t':'posting_journal', 'cl':'trans_id', 'z':'=', 'v':item.id, l:'AND'}, {'t':'posting_journal', 'cl':'origin_id', 'z':'=', 'v':item.transaction_type}]
            };
    db.execute(db.select(sql), function(err, record){
      if(record.length<1){
        getData(item, res);
      }
    });
  }); 
};
var saleDebit = function (obj, data, posting, res, periodExerciceIdObject){ 
  var deffer = Q.defer(); 
  var journalRecord = {};
  var objDebit = map[obj.t+'_debit'];
  for(var cle in objDebit){
    journalRecord[cle] = data[objDebit[cle]];
  }
  journalRecord.origin_id = posting.transaction_type; //this value wil be fetched in posting object
  journalRecord.user_id = posting.user;
  journalRecord.id = '';
  //FIXME: This code is deprecated.  Actually do this properly using a post from the client.
  journalRecord.deb_cred_type = 'D'; // TODO/FIXME
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
     'entities':[{'t':'debitor_group', 'c':['account_id']}],
     'cond':[{'t':'debitor_group', 'cl':'id', 'z':'=', 'v':data[0].group_id}]
    };
    db.execute(db.select(sql), function(err, data2){
      if (err) throw err;
      journalRecord.account_id = data2[0].account_id;
        var sql = db.insert('posting_journal', [journalRecord]);
        db.execute(sql, callback);
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
        for(var cle in objCredit){
          journalRecord[cle] = item[objCredit[cle]];    
        }
        journalRecord.origin_id = posting.transaction_type;
        journalRecord.user_id = posting.user;
        journalRecord.id = '';
        journalRecord.trans_date = util.convertToMysqlDate(journalRecord.trans_date);
        journalRecord.fiscal_year_id = periodExerciceIdObject.fid;
        journalRecord.period_id = periodExerciceIdObject.pid;
        journalRecord.account_id = data2[0].sales_account;
        var sql = db.insert('posting_journal', [journalRecord]); 
        db.execute(sql, callback);           
    });
  });
  return deffer.promise;
}

var cashDebit = function (obj, data, posting, res, periodExerciceIdObject){
  var deffer = Q.defer();
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
  }
  db.execute(db.select(sql),function(err, record){

    console.log("SQL1! ", err, record);
    journalRecord.account_id = record[0].debit_account;
    var sql = db.insert('posting_journal', [journalRecord]);
    console.log('ligne debit ', journalRecord);
    db.execute(sql, function (err, ans) {
      console.log("SQL2! ", err, ans);
      if (err){
        deffer.resolve({succes :false, info:err});
      }else{
      deffer.resolve({succes:true, info:ans});
      } 
    });
  });
  return deffer.promise;
}

var cashCredit = function (obj, data, posting, res, periodExerciceIdObject){
  var deffer = Q.defer();   
  var objCredit = map[obj.t+'_credit'];
  var journalRecord = {};
  journalRecord.id = '';
  var sql = {
              'entities':[{'t':'cash', 'c':['credit_account']}],
              'cond':[{'t':'cash', 'cl':'id', 'z':'=', 'v':posting.id}]
            }  
  db.execute(db.select(sql),function(err, data2){     
    journalRecord.account_id = data2[0].credit_account;
    data.forEach(function(item){    
      for(var cle in objCredit){
        journalRecord[cle] = item[objCredit[cle]];    
      }
      journalRecord.origin_id = posting.transaction_type;
      journalRecord.user_id = posting.user;
      journalRecord.deb_cred_type = 'C';
      delete(journalRecord.description);
      journalRecord.trans_date = util.convertToMysqlDate(journalRecord.trans_date);
      journalRecord.fiscal_year_id = periodExerciceIdObject.fid;
      journalRecord.period_id = periodExerciceIdObject.pid;
      var sql = db.insert('posting_journal', [journalRecord]); 
      console.log('ligne credit ', journalRecord);
      db.execute(sql, function (err, ans) {
        if (err){
          deffer.resolve({succes :false, info:err});
        }else{
          deffer.resolve({succes:true, info:ans});
        } 
      });
    });  
  });
  return deffer.promise;
};

var purchaseDebit = function(obj, data, posting, res, periodExerciceIdObject){
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

var purchaseCredit = function(obj, data, posting, res, periodExerciceIdObject){
  var deffer = Q.defer(); 
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
  var obj = map[service_name];
  if(service_name == 'sale'){
    Q.all([saleDebit(obj, data[0], posting, res, periodExerciceIdObject), saleCredit(obj, data, posting, res, periodExerciceIdObject), check(obj.t, posting.id)]).then(function(arr) {
      if(arr[0].succes==true && arr[1].succes==true && arr[2] == true){
        res.send({status: 200, insertId: arr[1].info.insertId});
      }
    });
  }else if(service_name == 'cash'){ 
    Q.all([cashDebit(obj, data, posting, res, periodExerciceIdObject), cashCredit(obj, data, posting, res, periodExerciceIdObject)]).then(function(arr) {    
      if(arr[0].succes==true && arr[1].succes==true){
        console.log('******************* on a gagne ***********************');
        res.send({status: 200, insertId: arr[1].info.insertId});
      } else {
        console.log("Something wrong: ", arr);
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
          if(result[0].succes) process(data, posting, res, result[0]); //verification et insertion eventuelle
        });        
      });
    }else if(service_name == 'cash'){
      var sql = {
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
      db.execute(db.select(sql), function(err, data){
      if(err) throw err;
      
        Q.all([getPeriodExerciceId(data[0].date, data[0].enterprise_id)]).then(function(result){
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









