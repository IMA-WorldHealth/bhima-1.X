var fs = require('fs');

const PATH_TO_FILE = './names.txt';

readFile(PATH_TO_FILE, parseNames);

function parseNames(err, data) { 
  var names = data.split('\n');
  var patients = [];
  
  names.forEach(function (name) { 
    var patient = {};

    patient.firstName = name.split(' ')[0];
    patient.secondName = name.split(' ')[1];

    if(patient.firstName && patient.secondName) patients.push(patient);
  });
  console.log(patients);

  formatSQL(patients);
}

function formatSQL(patientData) { 
  var sql = "insert into `patient` (`id`, `debitor_id`, `sex`, `first_name`, `last_name`, `dob`, `origin_location_id`, `current_location_id`) values\n"
  var sqlBody = [], debtorBody = [];

  patientData.forEach(function (patient, index) { 
    var gender = Math.random() <= 0.5 ? 'M' : 'F';
    var year = getInt(2014, 1900);
    sqlBody.push('(' + (index + 1) + ',' + (index + 1) + ',"' + gender + '","' + patient.firstName + '","' + patient.secondName + '", "' + year + '-06-01", 1, 1)');    
  });
  
  sql += sqlBody.join(',\n') + ';';
  
  //Debtors
  sql += '\n\ninsert into `debitor` (`id`, `group_id`, `text`) values\n';

  patientData.forEach(function (patient, index) { 
    debtorBody.push('(' + (index + 1) + ',' + getInt(1, 3) + ',' + ("'Debtor account for patient " + patient.firstName + ' ' + patient.secondName + "'") + ')'); 
  });

  sql += debtorBody.join(',\n') + ';';
  writeFile('./name.out', sql);
}

function writeFile(path, body) { 
  fs.writeFile(path, body, function(err) { 
    if(err) throw err;
    console.log('File written');
  });
}

function readFile(path, callback) { 
  fs.readFile(path, 'utf8', callback);
}

function getInt(high, low) { 
  return Math.round(Math.random() * (high - low) + low);
}
