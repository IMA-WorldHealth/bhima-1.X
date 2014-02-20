var fs = require('fs'), q = require('q');

var accountFilePath = "./ET09 PLAN COMPTABLE ALPHA.csv";
var maxAccountDetails = 8, schema = {};

// Account detail indexs
var accountLabel = 4, accountNumber = 5, differentiateEnterprise = 4;

readFile(accountFilePath).then(parseCSV);

function parseCSV(fileData) { 
  var rawSchema = [], index = 1;

  rawSchema = fileData.split(',');
    
  console.log('numlines', rawSchema.length / maxAccountDetails);
  
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
  
    console.log(schema);
    // console.log(accountIndex); 
    console.log(accountIndex.length);

  } catch (error) { 
    console.log(error);
  }

  // console.log(schema);
}

function readFile(filePath) { 
  var deferred = q.defer();
  
  fs.readFile(filePath, 'utf8', function(readError, readResult) { 
    if(readError) throw readError;
    deferred.resolve(readResult);
  });
  return deferred.promise;
}
