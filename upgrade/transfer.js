#!/usr/local/bin/node
var fs = require('fs'), q = require('q');
var currentFilePath = './current.sql';

var idRelation = {};

readFile(currentFilePath).then(parseInserts);

function parseInserts(fileData) { 
  var tableRelation = {};
  var rawData = fileData.split('\n');
  var lineData = rawData.filter(function(line) { 
    return line.search("INSERT INTO") >= 0;
  });

  // Super hacky
  lineData.forEach(function (line) { 
    tableRelation[line.split('`')[1]] = line;
  });

  // console.log(Object.keys(tableRelation));
  
  try { 
    upgradeCountry(tableRelation['country']);
    upgradeProvince(tableRelation['province']); 
  } catch(e) { 
    console.log(e);
  }
}

function simpleUpgrade(tableName, tableLine, upgradeMethod) {
  var splitLine = tableLine.split("),"), tableStore = [];
  var deferred = q.defer();

  idRelation[tableName] = {};
  splitLine.forEach(upgradeMethod);


}

function upgradeCountry(countryLine) { 
  var splitCountry = countryLine.split("),"), storeCountry = [];
  var deferred = q.defer();
  idRelation['country'] = {};

  splitCountry.forEach(function (country, index) { 
    var stripBrackets = country.substr(1, country.length-1).replace(');', ''); 
    
    // TODO Massive hack - use regex
    if (!index) stripBrackets = stripBrackets.substr(stripBrackets.indexOf('(')+1, stripBrackets.length);

    var splitInsert = stripBrackets.split(',');

    var updateId, currentId = splitInsert[0];
    
    updateId = uuid();
    
    idRelation['country'][currentId] = updateId;
    splitInsert[0] = updateId;

    // console.log(splitInsert);
    
    storeCountry.push('(' + splitInsert.join(',') + ')');

    // console.log('s', splitInsert); 
    // console.log('countryLine', splitInsert.join(','));
  });

  console.log("INSERT INTO", "`country`", "VALUES", storeCountry.join(',\n'));
  deferred.resolve();
  // console.log(storeCountry);
  return deferred.promise;
}

function upgradeProvince(provinceLine) { 
  var splitProvince = provinceLine.split("),"), storeProvince = [];
  var deferred = q.defer();
  idRelation['province'] = {};

  splitProvince.forEach(function (province, index) { 
    var stripBrackets = province.substr(1, province.length-1).replace(');', ''); 
    
    // TODO Massive hack - use regex
    if (!index) stripBrackets = stripBrackets.substr(stripBrackets.indexOf('(')+1, stripBrackets.length);

    var splitInsert = stripBrackets.split(',');

    var updateId, currentId = splitInsert[0];
    
    updateId = uuid();
    
    idRelation['province'][currentId] = updateId;
    splitInsert[0] = updateId;
    splitInsert[2] = idRelation['country'][splitInsert[2]];

    // console.log(splitInsert);
    
    storeProvince.push('(' + splitInsert.join(',') + ')');

    // console.log('s', splitInsert); 
    // console.log('countryLine', splitInsert.join(','));
  });

  console.log("INSERT INTO", "`province`", "VALUES", storeProvince.join(',\n'));
  deferred.resolve();
  // console.log(storeCountry);
  return deferred.promise;
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
    v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function readFile(filePath) { 
  var deferred = q.defer();
  
  fs.readFile(filePath, 'utf8', function(readError, readResult) { 
    if(readError) throw readError;
    deferred.resolve(readResult);
  });
  return deferred.promise;
}

