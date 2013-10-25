// auth.js

// 401 HTTP code is unauthorised.
// See: http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
// TODO: impliment more informative error codes
var url = require('url'),
    db = require('./database/db')({config: {user: 'bika', database: 'bika', host: 'localhost', password: 'HISCongo2013'}});

var users = {};

function logUserIn(id, username, password, req, res, next) {
  var composed_query = db.update('user', [{id: id, logged_in: 1}], ['id']);

  db.execute(composed_query, function (err, results) {
    if (err) { next(err); }
    //augmentation auth.js
    req.session.chemins = new Array();
    req.session.logged_in = true;  // maybe this is too asynchronous
    req.session.user_id = id;
    users[req.session.id] = [id, username, password];    
    
    var rigth_request = {'entities':[{t:'unit', c:['url']},{t:'permission', c:['id']},{t:'user', c:['id']}], 
                         'jcond':[{ts:['permission', 'user'], c:['id_user', 'id'], l:'AND'},{ts:['permission','unit'], c:['id_unit', 'id'], l:'AND'}],
                         'cond':[{t:'user', cl:'id', z:'=', v:req.session.user_id}]
                        };    
    var composed_query = db.select(rigth_request);
    db.execute(composed_query, function(err, results){
      if(err){
        next(err);
      }
      var taille = results.length;
      if(taille>0){
        for(var i = 0; i<taille; i++){
          req.session.chemins.push(results[i].url);
        }
        res.redirect('/');
    return;
      }
    });    
  });
//fin augmentation auth.js
}


var auth = function (req, res, next) {
  if (req.session.logged_in && req.url !== '/logout') {
    if (req.url === '/login.html' || req.url === '/login') {
      res.redirect('/');
      return;
    }else{
      checkPermission(req, res, next);

    }
   
  }

  if (req.url === "/login") {
    var u = req.body.username;
    var p = req.body.password;
    var dbquery = {
      'entities': [{t: 'user', c: ['id', 'logged_in']}],      
      'cond': [
        {t: 'user', cl: 'username', 'z': '=', v: u, l: 'AND'},
        {t: 'user', cl: 'password', 'z': '=', v: p}
      ]
    };
    var composed_query = db.select(dbquery);
    db.execute(composed_query, function (err, results) {
      if (err) { next(err); }
      if (results.length > 0) {
        (results[0].logged_in > 0) ? next(new Error('User already logged In')) : logUserIn(results[0].id, u, p, req, res, next);
      } else {
        res.redirect('/login.html');
      }
      return;
    });
  }

  if (req.url === "/login.html") {
    res.sendfile('./app/login.html');
    return;
  }

  if (!req.session.logged_in && req.url !== '/login') {
    res.redirect('/login.html');
    return;
  }

  if (req.url === '/logout') {
    var userpass = users[req.session.id];
    var composed_query = db.update('user', [{id: userpass[0], logged_in: 0}], ['id']);
    db.execute(composed_query, function (err, results) {
      if (err) { next(err); }  // NOTE: make a middleware that throws errors for us
      users[req.session.id] = null;
      req.session.destroy();
      res.redirect('/');
      return;
    });
  }

};

//nouvelle fonction, augmentation
var checkPermission = function (req,res,next){
  var chemin = url.parse(req.url).path;
  //test sur le chemin predefini
  if(chemin.match(new RegExp("js/")) ||
     chemin.match(new RegExp("css/")) ||
     chemin.match(new RegExp("html/")) ||
     chemin.match(new RegExp("data/")) ||
     chemin.match(new RegExp("/tree")) ||
     chemin.match(new RegExp("lib/")) ||
     chemin === '/' ||
     chemin === '/favicon.ico'){
    next();
    }else{
      var authorized = false;      
      for(var i=0; i<req.session.chemins.length; i++){
        if(chemin.match(new RegExp(req.session.chemins[i]))){
        authorized = true;
        break;
        }    
  }
  if(authorized){
    console.log('voice la la requette', chemin);
    console.log('ok, passe');
    next();
  }else{
    console.log('voice la la requette', chemin);
    console.log('ko, block');
    res.redirect('/');
    return;
  }
}  
}
//fin augmentation auth.js
module.exports = auth;
