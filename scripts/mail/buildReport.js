#!/usr/local/bin/node

var mysql = require('mysql');
var q = require('q');

// TODO Extract to config file ignored by git
var session = mysql.createConnection({
  host : 'localhost',
  user : 'kpk',
  password : 'HISCongo2013',
  database : 'kpk'
});

var dateFrom, dateTo;

// Hacky ordering
configureDates();

// Configure all data
var queryMap = { 
  "New_Patients" : "SELECT COUNT(uuid) as 'total' FROM patient WHERE registration_date >= " + dateFrom + " AND registration_date <= " + dateTo + " AND renewal = 0;",
  "Renewal_Patients" : "SELECT COUNT(uuid) as 'total' FROM patient WHERE registration_date >= " + dateFrom + " AND registration_date <= " + dateTo + " AND renewal = 1;",
}
var results = {};

var include = [
  introduction,
  systemInfo,
  patientTotalReport,
  financeOverview,
  footer
];

populateQuery().then(collateReports);

function collateReports() { 
  var sessionTemplate = [];

  include.forEach(function (templateMethod) { 
    sessionTemplate.push(templateMethod());  
  });

  // Write 
  console.log(sessionTemplate.join("\n"));
  session.end();
}

function introduction() {   
  return "<p>BHIMA System Report - Hopital Bon Berger</p>";
}

function systemInfo() { 
  return "<p><small>Report reference " + generateUuid() + "</small><br><small>" + new Date() + "</small></p>";
}

function patientTotalReport() { 
  var template = "<p>Today <b>%d</b> new patients where registered, <b>%d</b> returning patients where logged.</p>";
  var totalNew = results['New_Patients'][0].total;
  var totalReturning = results['Renewal_Patients'][0].total;

  return printf(template, totalNew, totalReturning);
}

function financeOverview() { 
  return "<p><b>$1,000,000</b> in revenue was generated courtasy of BHIMA<small><i>(tm)</i></small></p>";
}

function footer() { 
  return "";
}

function populateQuery() {
  var deferred = q.defer();
  var resolveStore = [];

  for (key in queryMap) { 
    resolveStore.push(query(queryMap[key]));  
  }

  q.all(resolveStore).then(function (result) { 
    
    Object.keys(queryMap).forEach(function (key, index) { 
      results[key] = result[index];
    });

    deferred.resolve();
  }, function (error) { 
    deferred.reject();  
  });

  return deferred.promise;
}

function query(request) { 
  var deferred = q.defer();
  
  session.query(request, function (err, result) { 
    if(err) return deferred.reject(err);
    return deferred.resolve(result);
  });

  return deferred.promise;
}

// TODO Date from and to can be set in configuration file 
function configureDates() { 
  var today = new Date();
  
  dateFrom = "\'" + today.getFullYear() + "-0" + (today.getMonth() + 1) + "-" + today.getDate() + " 00:00:00\'";
  
  today.setDate(today.getDate() + 1);
  dateTo = "\'" + today.getFullYear() + "-0" + (today.getMonth() + 1) + "-" + today.getDate() + " 00:00:00\'";
}

function generateUuid() { 
  var uuid; 
  uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
    v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
  return uuid;
}

//Naive templating function
function printf(template) {
  var typeIndex = [], tempTemplate = template, shift = 0;
  var replaceArguments = [];
  var types = {
    '%s' : '[object String]',
    '%d' : '[object Number]',
    '%l' : '[object Array]'
  };

  //read arguments - not sure how much 'use strict' aproves of this
  for(var i = 1; i < arguments.length; i += 1) {
    replaceArguments.push(arguments[i]);
  }

  Object.keys(types).forEach(function(matchKey) {
    var index = tempTemplate.indexOf(matchKey);
    while(index >= 0) {
      typeIndex.push({index: index, matchKey: matchKey});
      tempTemplate = tempTemplate.replace(matchKey, '');
      index = tempTemplate.indexOf(matchKey);
    }
  });

  typeIndex.sort(function(a, b) { return a.index > b.index; });
  typeIndex.forEach(function(replaceObj, index) {
    var targetArg = replaceArguments[index], replaceIndex = replaceObj.index + shift, matchKey = typeIndex[replaceIndex];
    if(Object.prototype.toString.call(targetArg) !== types[replaceObj.matchKey]) throw new Error("Argument " + targetArg + " is not " + types[replaceObj.matchKey]);
    template = template.replace(replaceObj.matchKey, targetArg);
    shift += targetArg.length;
  });
  return template;
}
