var fs = require('fs'), q = require('q');

var accountFilePath = "./ET09 PLAN COMPTABLE ALPHA.csv";
var maxAccountDetails = 8, schema = {}, schemaIndex;

// Account detail indexs
var accountLabel = 4, accountNumber = 5, differentiateEnterprise = 4;
var accountNumberLength = 7;

var sqlOutput = [];
readFile(accountFilePath).then(parseCSV);

function parseCSV(fileData) { 
  var rawSchema = [], index = 1;

  rawSchema = fileData.split(',');
    
  
  try { 
    do { 
      var enterpriseId, accountInstance, indexContext = index * maxAccountDetails; 
      var buildUniqueAccount = [];
      
      accountInstance = { 
        label   : rawSchema[indexContext + accountLabel],
        number  : rawSchema[indexContext + accountNumber]
      };
      // FIXME hacky - is there no splice in javascript?
      // Replace value that differentiates enterprises
      buildUniqueAccount.push(accountInstance.number.substr(0, differentiateEnterprise));
      buildUniqueAccount.push('0');
      buildUniqueAccount.push(accountInstance.number.substr(differentiateEnterprise + 1, accountInstance.number.length-1));
      
      enterpriseId = accountInstance.number[differentiateEnterprise];
      accountInstance.unique = buildUniqueAccount.join('');
      index++;
      
      if(schema[accountInstance.unique]) { 
        schema[accountInstance.unique].enterprises.push(enterpriseId);
      } else { 
        accountInstance.enterprises = [enterpriseId];
        schema[accountInstance.unique] = accountInstance;
      }
    } while (accountInstance.number);

    var accountIndex = JSON.parse(JSON.stringify(Object.keys(schema)));
  
    // console.log(accountIndex); 
    
    var accountGroupIndex = 1;
    var groups = {}, identify; 

  
    // for(var i=0; i < accountNumberLength; i++) { 

      //Visit every account - base case
      accountIndex.forEach(function (accountNumber) {
        var account = schema[accountNumber];
        var identify = accountNumber.slice(0, accountGroupIndex);
        
        if(groups[identify]) { 
          groups[identify][accountNumber] = accountNumber;
        } else { 
          groups[identify] = {}

          groups[identify][accountNumber] = accountNumber;
        }
      });
    // }    
    
    accountGroupIndex++;

    parseRelation(groups, accountGroupIndex);
    removeRedundant(groups, 1); 
    // groupDebugPrint(groups, 1);
    //
    // console.log(groups);
    // console.log(groups[7][71][710]);

    sqlPrint(groups, 0);
    
    console.log("insert into `account` (`fixed`, `locked`, `enterprise_id`, `account_number`, `account_txt`, `account_type_id`, `parent`) values"); 
    console.log(sqlOutput.join(',\n') + ';');
    // console.log('1 10', groups[1].children[10]);
  } catch (error) { 
    console.log(error);
  }
}

function groupDebugPrint(group, indentLevel) { 
  for(account in group) { 
    var spacer = new Array(indentLevel);
    console.log(spacer, account);

    if(account.length < accountNumberLength) { 
      groupDebugPrint(group[account], indentLevel + 1);
    }
  }
}

function sqlPrint(group, parentAccountNumber) { 
  for(account in group) { 
    
    if(account.length < accountNumberLength) { 
      var accountNumber = account;
      sqlOutput.push('(0, 0, 200,' + accountNumber + ',"Title Account for ' + account + '", 3,' + parentAccountNumber + ')'); 
      sqlPrint(group[account], accountNumber);
    } else { 
      var accountType = (account[0] === '6' || account[0] === '7') ? '1' : '2';
      sqlOutput.push('(0, 0, 200,' + account + ',"' + schema[account].label + '",' + accountType + ',' + parentAccountNumber + ')'); 
    }
  }
}

function padNumber(accountNumber) { 
  var difference = accountNumberLength - accountNumber.length;
  for(var i = 0; i <= difference; i++) { 
    accountNumber += '0';
  }
  return accountNumber;
}

function removeRedundant(group, indexLevel) { 
  for(accountIndex in group) { 
    var accountGroup = group[accountIndex], keys = Object.keys(accountGroup);
    // console.log('for ', accountIndex, 'length', keys.length);
    var iterate = true;
    
    if(keys.length === 1) { 

      while(keys.length === 1 && iterate) { 
        // console.log('would get', accountGroup[keys[0]]);
        group[keys[0]] = accountGroup[keys[0]];
        // console.log('deleting', accountIndex);
        delete group[accountIndex];
        
        accountGroup = group[keys[0]];
        accountIndex = keys[0];

        if(typeof(accountGroup) !== 'object') { 
          iterate = false;
        } else { 
          keys = Object.keys(accountGroup);
        }
      }
    } else { 
      removeRedundant(accountGroup, 1);
    }
  }
}

function parseRelation(group, indexLevel) { 

   
  for(accountIndex in group) { 
    var accountGroup = group[accountIndex]; 

    // crazy hacks
    if(accountIndex.length < accountNumberLength -1) { 
      
      for(account in accountGroup) { 
        var identify = account.slice(0, indexLevel);

        if(accountGroup[identify]) { 
          accountGroup[identify][account] = account;
        } else { 
          accountGroup[identify] = {};
          accountGroup[identify][account] = account;
        }

        delete accountGroup[account]; 
      }

      parseRelation(accountGroup, indexLevel+1);
    }
  }
}

function readFile(filePath) { 
  var deferred = q.defer();
  
  fs.readFile(filePath, 'utf8', function(readError, readResult) { 
    if(readError) throw readError;
    deferred.resolve(readResult);
  });
  return deferred.promise;
}
