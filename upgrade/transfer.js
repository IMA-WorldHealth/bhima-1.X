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
    simpleUpgrade('patient_group', tableRelation['patient_group'], upgradePatientGroup);
    simpleUpgrade('assignation_patient', tableRelation['assignation_patient'], upgradeAssignation);
    simpleUpgrade('inventory_group', tableRelation['inventory_group'], upgradeInventoryGroup);
    simpleUpgrade('inventory', tableRelation['inventory'], upgradeInventory);
    simpleUpgrade('sale', tableRelation['sale'], upgradeSale);
    simpleUpgrade('sale_item', tableRelation['sale_item'], upgradeSaleItem);
    simpleUpgrade('cash', tableRelation['cash'], upgradeCash);
    simpleUpgrade('cash_item', tableRelation['cash_item'], upgradeCashItem);
    simpleUpgrade('posting_journal', tableRelation['posting_journal'], upgradePostingJournal);
    simpleUpgrade('patient_visit', tableRelation['patient_visit'], upgradePatientVisit);
    simpleUpgrade('debitor_group_history', tableRelation['debitor_group_history'], upgradeDebtorGroupHistory);
    //debtor group history, patient_visitjj
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

function upgradePatientGroup(record, index) { 
  var recordValues = parseValues(record, index);
  var updateId, currentId = recordValues[1];

  // FIXME Temporary hack, this should be passed down through 
  var tableName = 'patient_group';
  var priceListReferenceTable = 'price_list';
  
  updateId = uuid();
  recordValues[1] = updateId;
  idRelation[tableName][currentId] = updateId;
  
  // FIXME Hack
  if (recordValues[2]!=="NULL") recordValues[2] = idRelation[priceListReferenceTable][recordValues[2]];

  return '(' + recordValues.join(',') + ')';

}

function upgradeAssignation(record, index) { 
  var recordValues = parseValues(record, index);
  var updateId, currentId = recordValues[0];

  // FIXME Temporary hack, this should be passed down through 
  var tableName = 'assignation_patient';
  var groupTable = 'patient_group';
  var patientTable = 'patient';
    
  updateId = uuid();
  
  recordValues[0] = updateId;
  recordValues[1] = idRelation[groupTable][recordValues[1]];
  recordValues[2] = idRelation[patientTable][recordValues[2]];

  return '(' + recordValues.join(',') + ')';
}

function upgradeInventoryGroup(record, index) { 
  var recordValues = parseValues(record, index);
  var updateId, currentId = recordValues[0];

  // FIXME Temporary hack, this should be passed down through 
  var tableName = 'inventory_group';
    
  updateId = uuid();
  
  recordValues[0] = updateId;
  idRelation[tableName][currentId] = updateId;

  return '(' + recordValues.join(',') + ')';
}

function upgradeInventory(record, index) { 
  var recordValues = parseValues(record, index);
  var updateId, currentId = recordValues[1];

  // FIXME Temporary hack, this should be passed down through 
  var tableName = 'inventory';
  var referenceTable = 'inventory_group';

  updateId = uuid();
  
  recordValues[1] = updateId;
  idRelation[tableName][currentId] = updateId;

  recordValues[6] = idRelation[referenceTable][recordValues[6]];

  return '(' + recordValues.join(',') + ')';
}

function upgradeSale(record, index) { 
  var recordValues = parseValues(record, index);
  var updateId, currentId = recordValues[1];

  // FIXME Temporary hack, this should be passed down through 
  var tableName = 'sale';
  var referenceTable = 'debitor';
   
  // Insert a reference
  recordValues.splice(1, 0, currentId);

  // Enterprise ID is now project ID 
  recordValues[0] = 1;

  updateId = uuid();
  
  recordValues[2] = updateId;
  idRelation[tableName][currentId] = updateId;

  recordValues[5] = idRelation[referenceTable][recordValues[5]];

  // Add a timestamp
  recordValues.push(recordValues[8].substr(0, recordValues[8].length-1) + " 00:00:00\'");

  return '(' + recordValues.join(',') + ')';
}

function upgradeSaleItem(record, index) { 
  var recordValues = parseValues(record, index);
  var updateId, currentId = recordValues[1];

  // FIXME Temporary hack, this should be passed down through 
  var tableName = 'sale_item';
  var saleReference = 'sale';
  var inventoryReference = 'inventory';

  updateId = uuid();
  
  recordValues[1] = updateId;
  // idRelation[tableName][currentId] = updateId;
  
  recordValues[0] = idRelation[saleReference][recordValues[0]];
  recordValues[2] = idRelation[inventoryReference][recordValues[2]];
  
  return '(' + recordValues.join(',') + ')';
}

function upgradeCash(record, index) { 
  var recordValues = parseValues(record, index);
  var updateId, currentId = recordValues[0];

  // FIXME Temporary hack, this should be passed down through 
  var tableName = 'cash';
  var referenceTable = 'debitor';
   
  // Insert a project ID and reference
  recordValues.splice(0, 0, '1', currentId);
  
  updateId = uuid();
  
  // Remove enterprise ID
  recordValues.splice(3, 1);

  recordValues[2] = updateId;
  idRelation[tableName][currentId] = updateId;

  recordValues[8] = idRelation[referenceTable][recordValues[8]];

  return '(' + recordValues.join(',') + ')';
}

function upgradeCashItem(record, index) { 
  var recordValues = parseValues(record, index);
  var updateId, currentId = recordValues[0];

  // FIXME Temporary hack, this should be passed down through 
  var tableName = 'cash_item';
  var saleReference = 'sale';
  var cashReference = 'cash';

  updateId = uuid();
  
  recordValues[0] = updateId;

  // idRelation[tableName][currentId] = updateId;
  
  recordValues[1] = idRelation[cashReference][recordValues[1]];
  recordValues[3] = idRelation[saleReference][recordValues[3]];
  
  return '(' + recordValues.join(',') + ')';
}

function upgradePostingJournal(record, index) { 
  var recordValues = parseValues(record, index);
  var updateId, currentId = recordValues[0];

  // FIXME Temporary hack, this should be passed down through 
  var tableName = 'posting_journal';
  var debtorReference = 'debitor';

  updateId = uuid();
  
  recordValues[0] = updateId;

  idRelation[tableName][currentId] = updateId;
 
  // Replace enterprise with project ID
  recordValues[1] = '1';
  recordValues[14] = idRelation[debtorReference][recordValues[1]];
  
  return '(' + recordValues.join(',') + ')';
}

function upgradePatientVisit(record, index) { 
  var recordValues = parseValues(record, index);
  var updateId, currentId = recordValues[0];

  // FIXME Temporary hack, this should be passed down through 
  var tableName = 'patient_visit';
  var patientReference = 'patient';

  updateId = uuid();
  
  recordValues[0] = updateId;
  recordValues[1] = idRelation[patientReference][recordValues[1]];
  
  return '(' + recordValues.join(',') + ')';
}

function upgradeDebtorGroupHistory(record, index) { 
  var recordValues = parseValues(record, index);
  var updateId, currentId = recordValues[0];

  // FIXME Temporary hack, this should be passed down through 
  var tableName = 'patient_visit';
  var debitorReference = 'debitor';
  var debitorGroupReference = 'debitor_group';

  updateId = uuid();
  
  recordValues[0] = updateId;
  recordValues[1] = idRelation[debitorReference][recordValues[1]];
  recordValues[2] = idRelation[debitorGroupReference][recordValues[2]];
  
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

