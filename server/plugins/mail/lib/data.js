var mysql = require('mysql');
var path = require('path');
var q = require('q');

var data = exports;

// TODO Set up absalute path to top of server structure
var cfg = require(path.join(__dirname, '../../../config/server.json'));

// TODO extract to config file ignored by git
var session = mysql.createConnection({
  host : cfg.db.host,
  user : cfg.db.user,
  password : cfg.db.password,
  database : cfg.db.database
});

var results = {};

data.process = function (query) { 

  console.log('Requesting information from database');
  var deferred = q.defer();
  var requests = [], keys = Object.keys(query);
  
  requests = keys.map(function (key) { 
    return dbQuery(query[key]);
  });
  
  q.all(requests)
  .then(function (queryResult) {
    keys.forEach(function (key, index) { 
      results[key] = queryResult[index];
    });
     
    deferred.resolve();
  })
  .catch(function (error) { 
    console.log('data read error');
    deferred.reject(error);
  });

  return deferred.promise;
};

data.lookup = function (key) { 
  return results[key];
};

data.end = function () { 
  return session.end();
};

function dbQuery(request) { 
  var deferred = q.defer();
  
  session.query(request, function (error, result) { 
    if(error) return deferred.reject(error);
    
    deferred.resolve(result);
  });
  return deferred.promise;
}
