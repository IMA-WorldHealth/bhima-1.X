//ce module a pour role de transformer une requette tres generale de l'arbre en un requette approprie, tenant compte de l'utilisateur et ses droits
var db = require('../database/db')({config: {user: 'bika', database: 'bika', host: 'localhost', password: 'HISCongo2013'}})
  , util = require('../util/util.js');
var map = {
  'sale':{'t':'sale', 'enterprise_id':'enterprise_id', 'transID':'id', 'currency_id':'currency_id', 'arapAccount':'debitor_id', 'transDate':'invoice_date', 'description':'note','fyearID':'fyearID', 'debitAmount':'cost'},
  'sale_debit':{'enterpriseID':'enterprise_id', 'transID':'id', 'currency_id':'currency_id', 'arapAccount':'debitor_id', 'transDate':'invoice_date', 'description':'note'/*,'fyearID':'fyearID'*/, 'debitAmount':'cost', 'invPoNum':'id'},
  'cash':{},
  'purchase_order':{}
}; //at left posting_journal property, at right service property such as sale, cash, purchase_order
var service_name = '';

exports.poster = function(req, res) {
  insert(req.body, res);
}

// FIXME Temporary fix, pass a reference to res through to process - this should be done with a callback/ promise
var insert = function(obj,res){  
  for(var i = 0; i<obj.length; i++){
      getData(obj[i], res);      
  } 
}

var debit = function (obj, data, posting){





  var journalRecord = {};
  var objDebit = map[obj.t+'_debit'];

  for(var cle in objDebit){
    journalRecord[cle] = data[objDebit[cle]];
  }
  journalRecord.posted = 0;
  journalRecord.origin_id = 1; //this value wil be fetched in posting object
  journalRecord.user_id = 1;
  journalRecord.id = '';
  journalRecord.transDate = util.convertToMysqlDate(journalRecord.transDate);
  console.log('journal record',journalRecord);


  var callback = function (err, record) {
    if (record.length < 1) {
      //insertion
      var sql = db.insert('posting_journal', [journalRecord]);
      db.execute(sql, function (err, ans) {
        if (err) throw err;
        //res.send({status: 200, insertId: ans.insertId});
      });
    } else {
      console.log('non');
    }
  }
  
  
  var sql = {
             'entities':[{'t':'debitor', 'c':['group_id']}],
             'cond':[{'t':'debitor', 'cl':'id', 'z':'=', 'v':journalRecord.arapAccount}]
            };
            var req = db.select(sql);
            console.log(req);
            db.execute(req, function(err, data){
              var sql = {
               'entities':[{'t':'debitor_group', 'c':['account_number']}],
               'cond':[{'t':'debitor_group', 'cl':'id', 'z':'=', 'v':data[0].group_id}]
              };
              db.execute(db.select(sql), function(err, data){
                journalRecord.account_id = data[0].account_number;
                console.log('journal record',journalRecord);
                var sql = {
              'entities' : [{'t':'posting_journal', 'c':['id']}],
              'cond' : [{'t':'posting_journal', 'cl':'transID', 'z':'=', 'v':journalRecord.transID, l:'AND'}, {'t':'posting_journal', 'cl':'origin_id', 'z':'=', 'v':journalRecord.origin_id}]
            };
            db.execute(db.select(sql), callback);

              })
            });
}

var process = function(data, posting, res){


  var obj = map[service_name];
  //var journalRecord = {};
  //write debitor
  debit(obj, data, posting);

  /*for(var cle in obj){
    if(cle != 't') journalRecord[cle] =data[obj[cle]];

  }*/
  //completing postingRecord data
  /*journalRecord.date = util.convertToMysqlDate(new Date());
  journalRecord.posted = 0;
  journalRecord.origin_id = 1; //this value wil be fetched in posting object
  journalRecord.user_id = 1;
  journalRecord.id = '';
  journalRecord.perform_date = util.convertToMysqlDate(journalRecord.perform_date);*/
  
}

var getData = function(posting, res){

  //each posting object contains transaction_id, service_id, user_id properties
  //request for knowing the service
  var sql = {
             'entities':[{'t':'transaction_type', 'c':['service_txt']}],
             'cond':[{'t':'transaction_type', 'cl':'id', 'z':'=', 'v':2}]
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
                    {'t':'sale_item', 'c':['inventory_id', 'total']}
                   ],
        'jcond':   [
                    {ts: ['sale', 'sale_item'], c: ['id', 'sale_id'],l: 'AND'}
                   ],
        'cond' :   [
                    {'t':obj.t, 'cl':'id', 'z':'=', 'v':100005}
                   ]
                };
      db.execute(db.select(sql), function(err, data){
      if(err) throw err;
      //console.log('tous sur le sale',data[0]);
      process(data[0], posting, res); //verification et insertion eventuelle
    });







    }else{
      /* var obj = map[service_name];
    var cle_tab = [];
    for (var cle in obj){
      if(cle!='t'){
        cle_tab.push(obj[cle]);
      }
    }

    //request for getting data
    var sql = {
                'entities':[{'t':obj.t, 'c':cle_tab}],
                'cond':[{'t':obj.t, 'cl':'id', 'z':'=', 'v':100001}] //in tead of 100000 posting will provide id
              };
    db.execute(db.select(sql), function(err, data){
      if(err) throw err;
      process(data[0], posting, res); //verification et insertion eventuelle
    });*/

    }
   
  });
}







