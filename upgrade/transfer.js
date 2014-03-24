#!/usr/local/bin/node
var fs = require('fs'), q = require('q');

var idRelation = {};
var tableRelation = {};
var newRelation = { 
  project : "INSERT INTO `project` (`id`, `name`, `abbr`, `enterprise_id`) values\n(1, 'IMCK Hopital Bon Berger', 'HBB', 200),\n(2, 'IMCK PAX Clinic', 'PAX', 200);",
  project_permission : "INSERT INTO `project_permission` (`user_id`, `project_id`) values\n(1, 1),\n(1, 2);",
  cash_box : "INSERT INTO cash_box (id, text, project_id) VALUES (1, 'IMCK HBB CAISSE PPLE ', 1),(2, 'IMCK HBB CAISSE AUX', 1),(3, 'IMCK PAX CAISSE AUX', 2);",
  cash_box_account_currency : "INSERT INTO cash_box_account_currency (id, currency_id, cash_box_id, account_id) VALUES (1, 1, 1, 486), (2, 2, 1, 487), (5, 1, 3, 488);",
  // cash_box_account_currency : "INSERT INTO cash_box_account_currency (id, currency_id, cash_box_id, account_id) VALUES (1, 1, 1, 486), (2, 2, 1, 487), (3, 1, 2, 1066), (4, 2, 2, 1067), (5, 1, 3, 488),(6, 2, 3, 1068);",
  caution_box : "INSERT INTO caution_box (id, text, project_id) VALUES (1, 'IMCK HBB CAUTION ', 1),(2, 'IMCK PAX CAUTION', 2);",
  caution_box_account_currency : "INSERT INTO caution_box_account_currency (id, currency_id, caution_box_id, account_id) VALUES (1, 2, 1, 249), (2, 2, 2, 250);"
};

var defaultPath = "./current.sql";
var writeLine = console.log;
  
parsePathArgument()
.then(readFile)
.then(parseInserts)
.then(upgradeDB);

function parsePathArgument() { 
  var path = process.argv[2] || defaultPath;
  return q.resolve(path);
}

function parseInserts(fileData) { 
  var rawData = fileData.split('\n');

  // Remove lines not concerned with entering data
  var lineData = rawData.filter(function(line) { 
    return line.search("INSERT INTO") >= 0;
  });

  // Parse out table names and map to insert values
  lineData.forEach(function (line) { 
    tableRelation[line.split('`')[1]] = line;
  });
  
  return q.resolve();
}

function upgradeDB() { 
  // try { 
    simpleUpgrade('country', upgradeCountry);
    simpleUpgrade('province', upgradeProvince);
    simpleUpgrade('sector', upgradeSector);
    simpleUpgrade('village', upgradeVillage);
  
    simpleTransfer('currency');
   
    simpleUpgrade('enterprise', upgradeEnterprise);
    
    simpleTransfer('unit');
    simpleTransfer('user');
    simpleTransfer('permission');
    simpleTransfer('account_type');
    simpleTransfer('account');
    simpleTransfer('fiscal_year');
    simpleTransfer('period');
    simpleTransfer('period_total');
 
    // New Project data
    simpleCreate('project');
    simpleCreate('project_permission');
    
    simpleCreate('cash_box');
    simpleCreate('cash_box_account_currency');
    simpleCreate('caution_box');
    simpleCreate('caution_box_account_currency');
    
    simpleTransfer('inventory_unit');
    simpleTransfer('inventory_type');
    simpleTransfer('transaction_type');
    simpleTransfer('exchange_rate');
      
    simpleUpgrade('price_list', upgradePriceList);
    simpleUpgrade('price_list_item', upgradePriceListItem);
    simpleUpgrade('debitor_group', upgradeDebtorGroup);
    simpleUpgrade('debitor', upgradeDebtor);
    simpleUpgrade('patient', upgradePatient);
    simpleUpgrade('patient_group', upgradePatientGroup);
    simpleUpgrade('assignation_patient', upgradeAssignation);
    simpleUpgrade('inventory_group', upgradeInventoryGroup);
    simpleUpgrade('inventory', upgradeInventory);
    simpleUpgrade('sale', upgradeSale);
    simpleUpgrade('sale_item', upgradeSaleItem);
    simpleUpgrade('cash', upgradeCash);
    simpleUpgrade('cash_item', upgradeCashItem);
    simpleUpgrade('credit_note', upgradeCreditNote);
    simpleUpgrade('patient_visit', upgradePatientVisit);
    simpleUpgrade('debitor_group_history', upgradeDebtorGroupHistory);
    simpleUpgrade('pcash', upgradePCash);
    simpleUpgrade('caution', upgradeCaution);
    simpleUpgrade('posting_journal', upgradePostingJournal);
  // } catch(e) { 
    // writeLine(e); 
  // }
}

function simpleUpgrade(tableName, upgradeMethod) {
  var tableLine = tableRelation[tableName];
  var upgradedStore, splitLine = tableLine.split("),");
  var deferred = q.defer();

  idRelation[tableName] = {};
  upgradedStore = splitLine.map(function (record, index) { 
    var recordValues = parseValues(record, index);
    
    return upgradeMethod(recordValues, tableName);
  });

  // Output 
  writeLine("LOCK TABLES `" + tableName + "` WRITE;");
  writeLine("INSERT INTO `" + tableName + "` VALUES \n" + upgradedStore.join(',\n') + ";");
  writeLine("UNLOCK TABLES;");
}

function simpleTransfer(tableName) { 
  writeLine(tableRelation[tableName] + " \n");
}

function simpleCreate(key) { 
  writeLine("LOCK TABLES `" + key + "` WRITE;");
  writeLine(newRelation[key]);
  writeLine("UNLOCK TABLES;");
}

function upgradeCountry(recordValues, tableName) { 
  var currentId = recordValues[0], updateId = uuid();
  
  idRelation[tableName][currentId] = updateId;
  recordValues[0] = updateId;
  return packageRecordValues(recordValues);
}

function upgradeProvince(recordValues, tableName) { 
  var currentId = recordValues[0], updateId = uuid();

  idRelation[tableName][currentId] = updateId;
  recordValues[0] = updateId;
  upgradeReference('country', recordValues, 2);
  return packageRecordValues(recordValues);
}

function upgradeSector(recordValues, tableName) { 
  var currentId = recordValues[0], updateId = uuid();
  
  idRelation[tableName][currentId] = updateId;
  recordValues[0] = updateId;
  upgradeReference('province', recordValues, 2); 
  return packageRecordValues(recordValues);
}

function upgradeVillage(recordValues, tableName) { 
  var currentId = recordValues[0], updateId = uuid();
  
  idRelation[tableName][currentId] = updateId;
  recordValues[0] = updateId;
  upgradeReference('sector', recordValues, 2); 
  return packageRecordValues(recordValues);
}

function upgradeEnterprise(recordValues, tableName) { 
  upgradeReference('village', recordValues, 5);
  return packageRecordValues(recordValues);
}

function upgradePriceList(recordValues, tableName) { 
  var currentId = recordValues[1], updateId = uuid();

  idRelation[tableName][currentId] = updateId;
  recordValues[1] = updateId;
  return packageRecordValues(recordValues);
}

function upgradePriceListItem(recordValues, tableName) { 
  var currentId = recordValues[0], updateId = uuid();
    
  recordValues[0] = updateId;
  upgradeReference('price_list', recordValues, 6);
  
  // Add column for inventory UUID
  recordValues.push('NULL');

  return packageRecordValues(recordValues);
}

function upgradeDebtorGroup(recordValues, tableName) { 
  var currentId = recordValues[1], updateId = uuid();
  
  idRelation[tableName][currentId] = updateId;
  recordValues[1] = updateId;
  upgradeReference('village', recordValues, 4);
  
  if (recordValues[13]!=="NULL") upgradeReference('price_list', recordValues, 13);
  return packageRecordValues(recordValues);
}

function upgradeDebtor(recordValues, tableName) { 
  var currentId = recordValues[0], updateId = uuid();
    
  idRelation[tableName][currentId] = updateId;
  recordValues[0] = updateId;
  upgradeReference('debitor_group', recordValues, 1);
  return packageRecordValues(recordValues);
}

function upgradePatient(recordValues, tableName) { 
  var currentId = recordValues[0], updateId = uuid();
  
  idRelation[tableName][currentId] = updateId;
  recordValues[0] = updateId;
  
  // Add project ID and reference
  recordValues.splice(1, 0, '1', currentId);
  
  upgradeReference('debitor', recordValues, 3);
  upgradeReference('village', recordValues, 23);
  upgradeReference('village', recordValues, 24);
  return packageRecordValues(recordValues);
}

function upgradePatientGroup(recordValues, tableName) { 
  var currentId = recordValues[1], updateId = uuid();
  
  recordValues[1] = updateId;
  idRelation[tableName][currentId] = updateId;
  
  if (recordValues[2]!=="NULL") upgradeReference('price_list', recordValues, 2);
  return packageRecordValues(recordValues);
}

function upgradeAssignation(recordValues, tableName) { 
  var currentId = recordValues[0], updateId = uuid();
    
  recordValues[0] = updateId;
  upgradeReference('patient_group', recordValues, 1);
  upgradeReference('patient', recordValues, 2);
  return packageRecordValues(recordValues);
}

function upgradeInventoryGroup(recordValues, tableName) { 
  var currentId = recordValues[0], updateId = uuid();
  
  recordValues[0] = updateId;
  idRelation[tableName][currentId] = updateId;
  return packageRecordValues(recordValues);
}

function upgradeInventory(recordValues, tableName) { 
  var currentId = recordValues[1], updateId = uuid();
  var inventoryText = [], recordLength = 16, finalText;
 
  // Resolve comma parsing issue, these should be escaped before parsing
  if (recordValues.length > recordLength) { 
    var diff = recordValues.length - recordLength;
    for (var i = 4, l = 4 + diff; i <= l; i++) {
      inventoryText.push(recordValues[i]);
    }

    finalText = inventoryText.join(',');
    recordValues.splice(4, diff + 1, finalText);
  }

  recordValues[1] = updateId;
  idRelation[tableName][currentId] = updateId;
  upgradeReference('inventory_group', recordValues, 6);
  return packageRecordValues(recordValues);
}

function upgradeSale(recordValues, tableName) { 
  var currentId = recordValues[1], updateId = uuid();

  // Insert a reference
  recordValues.splice(1, 0, currentId);

  // Enterprise ID is now project ID 
  recordValues[0] = 1;
  recordValues[2] = updateId;
  
  idRelation[tableName][currentId] = updateId;
  upgradeReference('debitor', recordValues, 5);

  // Add a timestamp
  recordValues.push(recordValues[8].substr(0, recordValues[8].length-1) + " 00:00:00\'");
  return packageRecordValues(recordValues);
}

function upgradeSaleItem(recordValues, tableName) { 
  var currentId = recordValues[1], updateId = uuid();

  recordValues[1] = updateId;
  
  upgradeReference('sale', recordValues, 0);
  upgradeReference('inventory', recordValues, 2);
  return packageRecordValues(recordValues);
}

function upgradeCash(recordValues, tableName) { 
  var currentId = recordValues[0], updateId = uuid();

  // Insert a project ID and reference
  recordValues.splice(0, 0, '1', currentId);
  
  // Remove enterprise ID
  recordValues.splice(3, 1);

  recordValues[2] = updateId;
  idRelation[tableName][currentId] = updateId;
  upgradeReference('debitor', recordValues, 8);
  return packageRecordValues(recordValues);
}

function upgradeCashItem(recordValues, tableName) { 
  var currentId = recordValues[0], updateId = uuid();

  recordValues[0] = updateId;
  
  upgradeReference('cash', recordValues, 1);
  upgradeReference('sale', recordValues, 3);
  return packageRecordValues(recordValues);
}

function upgradePostingJournal(recordValues, tableName) { 
  var currentId = recordValues[0], updateId = uuid();
  var recordLength = 21, journalText = [], finalText;
  var currentDebtor, currentSale;

  // Resolve comma parsing issue, these should be escaped before parsing
  if (recordValues.length > recordLength) { 
    var diff = recordValues.length - recordLength;
    for (var i = 7, l = 7 + diff; i <= l; i++) {
      journalText.push(recordValues[i]);
    }
    
    finalText = journalText.join(',');
    recordValues.splice(7, diff + 1, finalText);
  }

  
  currentDebtor = recordValues[14].replace(/\'/g, '');
  currentSale = recordValues[16].replace(/\'/g, '');

  recordValues[0] = updateId;
  idRelation[tableName][currentId] = updateId;
 
  // Replace enterprise with project ID
  recordValues[1] = '1';
   
  if(recordValues[14]!=="NULL") recordValues[14] = idRelation.debitor[currentDebtor];
  if(recordValues[16]!=="NULL") {
    var origin = recordValues[19];
        
    var referenceMap = { 
      '7' : 'caution',
      '8' : 'pcash'
    };
    
    if (referenceMap[origin]) { 
      recordValues[16] = idRelation[referenceMap[origin]][currentSale];
    } else { 
      recordValues[16] = idRelation.sale[currentSale];
    }
    
    // Mitigate 0 error, valid data shouldn't reach this point
    if (!recordValues[16]) recordValues[16] = "NULL";
  }
  return packageRecordValues(recordValues);
}

function upgradePatientVisit(recordValues, tableName) { 
  var currentId = recordValues[0], updateId = uuid();
  
  recordValues[0] = updateId;
  upgradeReference('patient', recordValues, 1);
  return packageRecordValues(recordValues);
}

function upgradeDebtorGroupHistory(recordValues, tableName) { 
  var currentId = recordValues[0], updateId = uuid();
  
  recordValues[0] = updateId;
  upgradeReference('debitor', recordValues, 1);
  upgradeReference('debitor_group', recordValues, 2);
  return packageRecordValues(recordValues);
}

function upgradePCash(recordValues, tableName) { 
  var currentId = recordValues[0], updateId = uuid();
  var currentDebtor; 
    
  idRelation[tableName][currentId] = updateId;
  
  // Add reference 
  recordValues.splice(0, 0, currentId);
  
  // Add project ID
  recordValues[2] = '1'; 
  recordValues[1] = updateId;

  currentDebtor = recordValues[5].replace(/\'/g, '');
  if (recordValues[5]!=="NULL") recordValues[5] = idRelation.debitor[currentDebtor];
  return packageRecordValues(recordValues);
}

function upgradePCashItem(recordValues, tableName) { 
  var currentId = recordValues[0], updateId = uuid();

  recordValues[0] = updateId;
  upgradeReference('pcash', recordValues, 1);
  upgradeReference('sale', recordValues, 3);
  return packageRecordValues(recordValues);
}

function upgradeCaution(recordValues, tableName) { 
  var currentId = recordValues[0], updateId = uuid();
  var cautionText, dateLength = 11;
  // Add reference 
  recordValues.splice(0, 0, currentId);

  // Add project ID
  recordValues[4] = '1'; 
  
  idRelation[tableName][currentId] = updateId;
  recordValues[1] = updateId;
  
  upgradeReference('debitor', recordValues, 5);

  // Add cash box ID
  recordValues.push('2');
 
  // Super hacks
  cautionText = ["CAP", updateId, recordValues[3].substr(0, dateLength)].join('/').replace(/\'/g, '');
  
  // Add caution description
  recordValues.push("\'" + cautionText + "\'");
  return packageRecordValues(recordValues);
}

function upgradeCreditNote(recordValues, tableName) { 
  var currentId = recordValues[1], updateId = uuid();
  
  recordValues[1] = updateId;
  
  upgradeReference('debitor', recordValues, 3);
  upgradeReference('sale', recordValues, 5);
  
  // Update enterprise ID to Project ID
  recordValues[0] = '1';
  recordValues.splice(1, 0, currentId);

  return packageRecordValues(recordValues);
}

function upgradeReference(tableReference, recordValues, index) { 
  recordValues[index] = idRelation[tableReference][recordValues[index]];
}

// Returns individual values from an SQL insert
function parseValues(record, index) { 
  var stripBrackets = record.substr(1, record.length-1).replace(');', '');
  if (!index) stripBrackets = stripBrackets.substr(stripBrackets.indexOf('(')+1, stripBrackets.length);
  return stripBrackets.split(','); 
}

function packageRecordValues(recordValues) { 
  return '(' + recordValues.join(',') + ')';
}

function uuid() {
  var sessionUuid;
  sessionUuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
    v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
  
  // Sanitise UUID
  return "\'" + sessionUuid + "\'";
}

function readFile(filePath) { 
  var deferred = q.defer();
  
  fs.readFile(filePath, 'utf8', function(readError, readResult) { 
    if(readError) throw readError;
    deferred.resolve(readResult);
  });

  return deferred.promise;
}

function handleError(error) { 
  throw error;
}
