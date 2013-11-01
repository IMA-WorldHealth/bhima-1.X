//ce module a pour role de transformer une requette tres generale de l'arbre en un requette approprie, tenant compte de l'utilisateur et ses droits
var db = require('../database/db')({config: {user: 'bika', database: 'bika', host: 'localhost', password: 'HISCongo2013'}})
  , queryHandler = require('../database/myQueryHandler')
  , url = require('url');

exports.poster = function(req, res) {
  /*
  1. Le numero de facture ne doit pas exister dans la table
  2. Voir si le seller peut effectuer la vente
  3. Disacount doit etre superieur a zero
  4. date facure n'est pas etre posterieure a la date du jour
  5. Posted doit etre a false
  */
  //insertion
  insert(req.body); 

}

var insert = function(obj){
  var journalRecords = [];
  var cb = function (err, ans) {
    if (err) throw err;
    console.log("Post success", ans);
  }
  //var insertsql = db.insert(obj.t, obj.data);
  //db.execute(insertsql, cb);
  //console.log(obj.data[0]); 
  var date = new Date();
  for(var i=0; i<obj.data.length; i++){

    journalRecords.push({id:'',
                        enterprise_id:obj.data[i].enterprise_id,
                        fiscal_id:2013001,
                        user_id:obj.data[i].seller_id,
                        sales_id:obj.data[i].id,
                        date:obj.data[i].invoice_date,
                        description:'rien'
                       });
  }
  var insertsql = db.insert(obj.t, journalRecords);
  console.log(insertsql);
  db.execute(insertsql, cb);


  //console.log(journalRecord);
  //console.log(insertsql);
  //console.log(insertsql);
    //console.log(obj.data[i]);
    //console.log(insertsql);
  //
}







