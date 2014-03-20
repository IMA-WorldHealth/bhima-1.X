#!/usr/local/bin/node

// TODO extract upgrade method one more level, pass values into upgrade, manipulate and return 
//      (table name should be passed down through)
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
    // upgradeCountry(tableRelation['country']);
    // upgradeProvince(tableRelation['province']); 
    simpleUpgrade('country', tableRelation['country'], upgradeCountry);
    simpleUpgrade('province', tableRelation['province'], upgradeProvince);
    simpleUpgrade('sector', tableRelation['sector'], upgradeSector);
    simpleUpgrade('village', tableRelation['village'], upgradeVillage);
    simpleUpgrade('price_list', tableRelation['price_list'], upgradePriceList);
    simpleUpgrade('price_list_item', tableRelation['price_list_item'], upgradePriceListItem);
    simpleUpgrade('debitor_group', tableRelation['debitor_group'], upgradeDebtorGroup);
    simpleUpgrade('debitor', tableRelation['debitor'], upgradeDebtor);
    simpleUpgrade('patient', tableRelation['patient'], upgradePatient);
  } catch(e) { 
    console.log(e);
  }
}

function simpleUpgrade(tableName, tableLine, upgradeMethod) {
  var upgradedStore, splitLine = tableLine.split("),");
  var deferred = q.defer();

  idRelation[tableName] = {};
  upgradedStore = splitLine.map(upgradeMethod);
  
  // Output 
  console.log("INSERT INTO `" + tableName + "` VALUES " + upgradedStore.join(',\n'));
}

function upgradeCountry(record, index) { 
  var recordValues = parseValues(record, index);
  var updateId, currentId = recordValues[0];

  // FIXME Temporary hack, this should be passed down through 
  var tableName = 'country';
  
  updateId = uuid();
  idRelation[tableName][currentId] = updateId;
  recordValues[0] = updateId;

  return '(' + recordValues.join(',') + ')';
}

function upgradeProvince(record, index) { 
  var recordValues = parseValues(record, index);
  var updateId, currentId = recordValues[0];

  // FIXME Temporary hack, this should be passed down through 
  var tableName = 'province';
  var referenceTable = 'country';
  
  updateId = uuid();
  idRelation[tableName][currentId] = updateId;
  recordValues[0] = updateId;
  recordValues[2] = idRelation[referenceTable][recordValues[2]];

  return '(' + recordValues.join(',') + ')';
}

function upgradeSector(record, index) { 
  var recordValues = parseValues(record, index);
  var updateId, currentId = recordValues[0];

  // FIXME Temporary hack, this should be passed down through 
  var tableName = 'sector';
  var referenceTable = 'province';
  
  updateId = uuid();
  idRelation[tableName][currentId] = updateId;
  recordValues[0] = updateId;
  recordValues[2] = idRelation[referenceTable][recordValues[2]];

  return '(' + recordValues.join(',') + ')';
}

function upgradeVillage(record, index) { 
  var recordValues = parseValues(record, index);
  var updateId, currentId = recordValues[0];

  // FIXME Temporary hack, this should be passed down through 
  var tableName = 'village';
  var referenceTable = 'sector';
  
  updateId = uuid();
  idRelation[tableName][currentId] = updateId;
  recordValues[0] = updateId;
  recordValues[2] = idRelation[referenceTable][recordValues[2]];

  return '(' + recordValues.join(',') + ')';
}

function upgradePriceList(record, index) { 
  var recordValues = parseValues(record, index);
  var updateId, currentId = recordValues[1];

  // FIXME Temporary hack, this should be passed down through 
  var tableName = 'price_list';

  updateId = uuid();
  idRelation[tableName][currentId] = updateId;
  recordValues[1] = updateId;

  return '(' + recordValues.join(',') + ')';
}

function upgradePriceListItem(record, index) { 
  var recordValues = parseValues(record, index);
  var updateId, currentId = recordValues[0];

  // FIXME Temporary hack, this should be passed down through 
  var tableName = 'price_list_item';
  var referenceTable = 'price_list';
    
  updateId = uuid();
  // idRelation[tableName][currentId] = updateId;
  recordValues[0] = updateId;

  recordValues[6] = idRelation[referenceTable][recordValues[6]];

  return '(' + recordValues.join(',') + ')';
}

function upgradeDebtorGroup(record, index) { 
  var recordValues = parseValues(record, index);
  var updateId, currentId = recordValues[1];

  // FIXME Temporary hack, this should be passed down through 
  var tableName = 'debitor_group';
  var locationReferenceTable = 'village';
  var priceListReferenceTable = 'price_list';
  
  updateId = uuid();
  idRelation[tableName][currentId] = updateId;
  recordValues[1] = updateId;
  recordValues[4] = idRelation[locationReferenceTable][recordValues[4]];
  
  // FIXME Hack
  if (recordValues[13]!=="NULL") recordValues[13] = idRelation[priceListReferenceTable][recordValues[13]];

  return '(' + recordValues.join(',') + ')';
}

function upgradeDebtor(record, index) { 
  var recordValues = parseValues(record, index);
  var updateId, currentId = recordValues[0];

  // FIXME Temporary hack, this should be passed down through 
  var tableName = 'debitor';
  var referenceTable = 'debitor_group';
    
  updateId = uuid();
  
  idRelation[tableName][currentId] = updateId;
  
  recordValues[0] = updateId;
  recordValues[1] = idRelation[referenceTable][recordValues[1]];

  return '(' + recordValues.join(',') + ')';
}

function upgradePatient(record, index) { 
  var recordValues = parseValues(record, index);
  var updateId, currentId = recordValues[0];

  // FIXME Temporary hack, this should be passed down through 
  var tableName = 'patient';
  var referenceTable = 'debitor', locationTable = 'village';
    
  updateId = uuid();
  
  idRelation[tableName][currentId] = updateId;
  
  recordValues[0] = updateId;
  
  // 1 references project 1 (HBB), currentId is now the patient reference
  recordValues.splice(1, 0, '1', currentId);
  
  recordValues[3] = idRelation[referenceTable][recordValues[3]];
  recordValues[23] = idRelation[locationTable][recordValues[23]];
  recordValues[24] =  idRelation[locationTable][recordValues[24]];

  return '(' + recordValues.join(',') + ')';
}

// Returns individual values from an SQL insert
function parseValues(record, index) { 
  var stripBrackets = record.substr(1, record.length-1).replace(');', '');
  if (!index) stripBrackets = stripBrackets.substr(stripBrackets.indexOf('(')+1, stripBrackets.length);
  return stripBrackets.split(','); 
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

