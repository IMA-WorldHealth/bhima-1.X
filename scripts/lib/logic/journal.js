//ce module a pour role de transformer une requette tres generale de l'arbre en un requette approprie, tenant compte de l'utilisateur et ses droits
var db = require('../database/db')({config: {user: 'bika', database: 'bika', host: 'localhost', password: 'HISCongo2013'}})
  , util = require('../util/util.js');
var map = {
  'sale':{'t':'sale', 'cost':'cost', 'discount':'discount', 'perform_date':'invoice_date', 'paid':'paid', 'enterprise_id':'enterprise_id', 'line_id':'id', 'currency_id':'currency_id', 'debitor_id':'debitor_id', 'document_id':'id'},
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

var process = function(data, posting, res){


  var obj = map[service_name];
  var journalRecord = {};
  for(var cle in obj){
    if(cle != 't') journalRecord[cle] =data[obj[cle]];

  }
  //completing postingRecord data
  journalRecord.date = util.convertToMysqlDate(new Date());
  journalRecord.posted = 0;
  journalRecord.origin_id = 1; //this value wil be fetched in posting object
  journalRecord.user_id = 1;
  journalRecord.id = '';
  journalRecord.perform_date = util.convertToMysqlDate(journalRecord.perform_date);
  var callback = function (err, record) {
    if (record.length < 1) {
      //insertion
      var sql = db.insert('posting_journal', [journalRecord]);
      db.execute(sql, function (err, ans) {
        if (err) throw err;
        res.send({status: 200, insertId: ans.insertId});
      });
    } else {
    }
  }
  var sql = {
              'entities' : [{'t':'posting_journal', 'c':['id']}],
              'cond' : [{'t':'posting_journal', 'cl':'line_id', 'z':'=', 'v':journalRecord.line_id, l:'AND'}, {'t':'posting_journal', 'cl':'origin_id', 'z':'=', 'v':journalRecord.origin_id}]
            };
  var request = db.select(sql);
  db.execute(request, callback);
}

var getData = function(posting, res){

  //each posting object contains transaction_id, service_id, user_id properties
  //request for knowing the service
  var sql = {
             'entities':[{'t':'service', 'c':['service_txt']}],
             'cond':[{'t':'service', 'cl':'id', 'z':'=', 'v':2}]
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

    //request for getting data
    var sql = {
                'entities':[{'t':obj.t, 'c':cle_tab}],
                'cond':[{'t':obj.t, 'cl':'id', 'z':'=', 'v':100001}] //in tead of 100000 posting will provide id
              };
    db.execute(db.select(sql), function(err, data){
      if(err) throw err;
      process(data[0], posting, res); //verification et insertion eventuelle
    });
  });
}







