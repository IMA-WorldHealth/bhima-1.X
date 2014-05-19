var mysql = require('mysql');
var q = require('q');

var data = exports;

// TODO extract to config file ignored by git
var session = mysql.createConnection({
  host : 'localhost',
  user : 'kpk',
  password : 'HISCongo2013',
  database : 'kpk'
});
var results = {};

data.process = function (query) { 
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
    if(error) return q.reject(error);
    
    deferred.resolve(result);
  });
  return deferred.promise;
}
