var fs = require('fs');

const PATH_TO_FILE = './excel_accounts.txt';

const TITLE = 3;
const INCOME_EXPENSE = 1;
const BALANCE = 2;

function Account(number, description, type) { 
  this.number = number;
  this.description = description;
  this.type = type;
}

function init() { 
  readAccountFile(PATH_TO_FILE, parseAccounts);
}

function parseAccounts(err, accountData) { 
  var accountLines = accountData.split('\n');

  //indentation 
  //2 - title account
  //3 - indented once (belongs to title account)
  //6 - belongs to sub cat
  //7 - belongs to sub sub cat

  var temporaryAccountStore = [];

  accountLines.forEach(function(accountLine) { 
    var parsedAccountLine = parseAccountLine(accountLine.split(' '));
    if(parsedAccountLine) temporaryAccountStore.push(parsedAccountLine);
  });
  
  writeExtractedAccounts(labelAccountHeirachy(temporaryAccountStore));
}

function writeExtractedAccounts(accounts) { 

  var i = 0;
  var titleSQL = '';
  var accountSQL = [];
  var output;
  var accountHeader;
  
  var accountHeader = "insert into `account` (`id`, `fixed`,  `locked`, `enterprise_id`, `account_number`, `account_txt`, `account_type_id`, `parent`) values\n";
  i = 0;
  accounts.forEach(function(account, index) { 
    accountSQL.push('\n(' + i + ', 1, 0, 200, ' + account.number + ', "' + account.description + '", ' + account.type + ', ' + account.parent + ')');
    i++;
  });


  output = accountHeader + accountSQL.join(',');

  //accounts
  writeAccountFile("./output.sql", output);
}

function writeAccountFile(path, body) { 
  fs.writeFile(path, body, function(err) { 
    if(err) throw err;
    console.log('Account file successfully written.');
  });
}

function labelAccountHeirachy(accountList) { 
  //this is where things get hacky and tighly coupled
  
  var rootParent = '0';

  var previousFirst, previousSecond, previousThird;

  //first iteration - assign title accounts and indentation levels
  accountList.forEach(function(account, index) { 

    var firstDigit = account.number[0];

    if(firstDigit === '6' || firstDigit === '7') { 
      account.type = INCOME_EXPENSE;
    } else { 
      account.type = BALANCE;
    }

    account.parent = rootParent;
    account.hasChildren = 0;
    previousWhitespace = account.whitespace;

    switch(account.whitespace) { 
      case 2 : 
        previousFirst = account.number;
        account.type = TITLE;
        break;
      case 3 : 
        account.parent = previousFirst;
        previousSecond = account.number;
        break;
      case 6: 
        account.parent = previousSecond;
        previousThird = account.number;
        break;
      case 7: 
        account.parent = previousThird;
        break;
    }
  });

  //second iteration - assign has children 
  accountList.forEach(function(account, index) { 
    var nextAccount = accountList[index + 1];
    if(nextAccount) {
      if(nextAccount.parent === account.number) {
        account.hasChildren = 1;
        account.type = TITLE;
      }
    }
  });

  return accountList;
}

function parseAccountLine(accountLine) { 
  
  var i = 1;
  var k;
  var whitespaceCount = 1;
  var description = [];
  var currentIndex;
  
  var packagedAccountLine = {};
  
  if(accountLine[0] !== '') { 

    //assign account number
    packagedAccountLine.number = accountLine[0];

    //determine number of spaces between account number and description
    do { 
      whitespaceCount++;
      i++;
    } while(accountLine[i] === '');
    packagedAccountLine.whitespace = whitespaceCount;

    //read description
    currentIndex = whitespaceCount;
    for(var k = currentIndex; k < accountLine.length; k++) { 
      if(accountLine[k] !== '') description.push(accountLine[k]);
    }
    packagedAccountLine.description = description.join(' ').trim();
    return packagedAccountLine;
  }
  return null;
}

function readAccountFile(path, callback) { 
  fs.readFile(path, 'utf8', callback);
}



init();
