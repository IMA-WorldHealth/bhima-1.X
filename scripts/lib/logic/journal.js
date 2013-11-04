//ce module a pour role de transformer une requette tres generale de l'arbre en un requette approprie, tenant compte de l'utilisateur et ses droits
var db = require('../database/db')({config: {user: 'bika', database: 'bika', host: 'localhost', password: 'HISCongo2013'}})
  , util = require('../util/util.js');

exports.poster = function(req, res) {
  insert(req.body, res);
}

var insert = function(obj,res){  
  for(var i = 0; i<obj.length; i++){
    getData(obj[i], function(err, data){
      if(err) throw err;
      process(data[0]); //verification et insertion eventuelle    
    });
  } 
}

var process = function(data){
  var date = util.convertToMysqlDate(new Date());
  var callback = function(err, record){
    if(record.length<1){
      //insertion
      var sql = db.insert('posting_journal', [{id:'',
                                       enterprise_id: data.enterprise_id,
                                       user_id: data.seller_id,
                                       sale_id:data.id,
                                       date:date,
                                       description:data.note,
                                       posted: 0
                                      }
                                     ]
                          );
      db.execute(sql, function (err, ans) {
                       if (err) throw err;
                       console.log("Post success", ans);
                      });
    }else{
      console.log('on insert pas');
    }
  }
  var sql = {};
  var entities = [{t:'posting_journal', c:['sale_id']}];
  var cond = [{t:'posting_journal', cl:'sale_id', z:'=', v:data.id}];
  sql.entities = entities;
  sql.cond = cond;
  var request = db.select(sql);
  db.execute(request, callback);
}

var getData = function(id, callback){
  var sql = {};
  var entities = [{t:'sale', c:['id', 'enterprise_id', 'seller_id', 'note']}];
  var cond = [{t:'sale', cl:'id', z:'=', v:id}];
  sql.entities = entities;
  sql.cond = cond;
  var request = db.select(sql);
  db.execute(request, callback);
}







