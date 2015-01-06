// Clean up the patient names in the database

// The names we want to scrub
var names = ['first_name', 'last_name', 'father_name', 'mother_name', 'spouse'];

// Set up the database
var db = require('../../server/lib/db');
db.initialise();

// Get and process the names
db.exec('SELECT uuid, ' + names.join(', ') + ' FROM patient')
.then(function (rawPatients) {
  console.log('Procssing ', rawPatients.length, 'patients');
  rawPatients.forEach(function (patient) {

    var origPatient = clone(patient);

    names.forEach(function (name) {

      // Delete any 'rien' (change to null)
      if (patient[name] && patient[name].toLowerCase() === 'rien') {
	console.log('Deleted \''+patient[name]+'\'', name, ' for: ', 
		    patient.first_name, patient.last_name, 
		    ' (UUID: ', patient.uuid, ')');
	patient[name] = null;
	}

      // Normalize all names
      patient[name] = normalizeName(patient[name]);
      });

    if (nameChanged(patient, origPatient)) {

      
      }

    // console.log(patient.first_name, patient.last_name);

  });
  process.exit(0);
})
.catch(function (err) { throw err; })
.done();

function clone(obj) { 
  return JSON.parse(JSON.stringify(obj)); 
}

// Normalize a name:
// (Copied from client/src/js/services/util.js)
function normalizeName(name) {
  if (typeof name === 'undefined') {
    return name;
    }
  if (name === null) {
    return name;
  }
  var names = name.trim().split(/\s+/);
  for(var i = 0; i < names.length; i++) {
    names[i] = names[i].charAt(0).toUpperCase() + names[i].slice(1).toLowerCase();
  }
  return names.join(' ');
}


function nameChanged(pat1, pat2) {
  for(var i = 0; i < names.length; i++) {
    name = names[i];
    if (pat1[name] !== pat2[name]) {
      return true;
      }
  }

  return false;
}
