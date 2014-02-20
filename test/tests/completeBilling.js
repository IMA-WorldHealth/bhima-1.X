var credentials = {
  username : 'sfount',
  password : '1'
};

var bhimaUtil = require('../../test/bhimaUtil.js')(credentials);

var patient = { 
  firstName : "NewPatient",
  secondName : "SecondName",
  yob : "1993",
  sex : "M",
  debtorGroup : "3"
};

module.exports = {
  'login' : bhimaUtil.login,

  'registerPatient' : function(client) {
    bhimaUtil.navigateTree('Hospital', 'Patient Registration', client);
    client.waitForElementVisible('div[id=patientDetails]', 1000);

    client
      .setValue('input[id="first-name"]', patient.firstName)
      .setValue('input[id="second-name"]', patient.secondName)
      .setValue('input[id="yob"]', patient.yob)
      .click('input[value="' + patient.sex + '"]')
      .assert.visible('select[id="debtor-group"] > [value="' + patient.debtorGroup + '"]')
      .click('select[id="debtor-group"] > [value="' + patient.debtorGroup + '"]');

    client.click('a[id="submitPatient"]');
    
    //Hacky - could use waitFor and begin next test on that
    client.pause(500);

    //Hacky again - what if the language is Fr ?
    client.assert.containsText('header', 'Receipts');
  },

  'billPatient' : function(client) {
    console.log('reached patient billing');

    bhimaUtil.navigateTree('Finance', 'Sales', client);
    
    client.waitForElementVisible('[id=findPatient]', 1000);
    
    client.click('[id=findByName]')
      .setValue('[id=findSearch]', patient.firstName + ' ' + patient.secondName)
      .click('[id=submitSearch]')
      .pause(4000);
  },

  'logout' : bhimaUtil.logout
};
