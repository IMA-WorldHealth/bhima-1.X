var credentials = { 
  username : 'sfount',
  password : '1'
};

var bhimaUtil = require('../../test/bhimaUtil.js')(credentials);

var patient = { 
  firstName : "Steven",
  secondName : "Fountain",
  yob : "1993",
  sex : "M",
  debtorGroup : "3"
}

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
      .click('select[id="debtor-group"]')
      .assert.visible('option[value="' + patient.debtorGroup + '"]')
      .setValue('select[id="debtor-group"]', patient.debtorGroup);
  },

  'logout' : bhimaUtil.logout
};
