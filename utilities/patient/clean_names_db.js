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

      var query = 'UPDATE patient ';
      names.forEach(function (name) {
	// ???
	});

// UPDATE patient SET first_name='Joe', last_name='Blow', dob='1981-06-01', sex='M', father_name='Bill Blow', mother_name='Sandra Smith Blow', title='Dr', profession='Doctor', employer='HBB', marital_status='married', spouse='Jane Doe', spouse_profession='Engineer', spouse_employer='IMCK', religion='Presbyterian', phone='111-222-1234', email='test@gmail.com', address_1='100 Elm Stree', origin_location_id='6c5b6b00-1e11-4522-b553-7047fe7723fa', current_location_id='bda70b4b-8143-47cf-a683-e4ea7ddd4cff' WHERE uuid='606d2d3b-1e05-4193-ac5d-e54c7fe0e8de';
      
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
