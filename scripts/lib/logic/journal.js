//ce module a pour role de transformer une requette tres generale de l'arbre en un requette approprie, tenant compte de l'utilisateur et ses droits
var db = require('../database/db')({config: {user: 'bika', database: 'bika', host: 'localhost', password: 'HISCongo2013'}})
  , queryHandler = require('../database/myQueryHandler')
  , url = require('url')
  , util = require('../util/util.js');

exports.poster = function(req, res) {
  insert(req.body, res);
}






var insert = function(obj,res){
  var cb = function (err, ans) {
    if (err) throw err;
    console.log("Post success", ans);
    res.send({status: 200, insertId: ans.insertId});
  }; 
  var date = util.convertToMysqlDate(new Date());
  var journalRecords = [];
  for(var i = 0; i<obj.length; i++){
    getData(obj[i], function(err, data){
      if(err) throw err;
      //insertion
      var sql = db.insert('journal', [{id:'',
                           enterprise_id: data[0].enterprise_id,
                           user_id: data[0].seller_id,
                           sale_id:data[0].id,
                           date:date,
                           description:data[0].note,
                           posted: 0
                          }]);
      db.execute(sql, cb);
    });
  } 

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







