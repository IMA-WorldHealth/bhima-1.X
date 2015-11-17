
/*global describe, it, beforeEach, inject, browser */

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
var expect = chai.expect;

describe('patient registration', function () {
  // this.timeout(30000);

  var REGISTRATION_PATH = '#/patients/register';

  var mockPatient = { 
    first_name : 'Mock',
    middle_name : 'Patient', 
    last_name : 'Frist',
    // dob : '1993-06-01T00:00:00.000Z',
    yob : '1993',
    // current_location_id : 'bda70b4b-8143-47cf-a683-e4ea7ddd4cff',
    // origin_location_id : 'bda70b4b-8143-47cf-a683-e4ea7ddd4cff',
    sex : 'M',
    project_id : 1,
    hospital_no : 120
  };

  var debtorGroupUuid = 'string:66f03607-bfbc-4b23-aa92-9321ca0ff586';


  beforeEach(function () {
    // navigate to the patient registration page
    browser.get(REGISTRATION_PATH);
  });

  it('navigates and loads correctly', function () {
    expect(browser.getCurrentUrl()).to.eventually.equal(browser.baseUrl + REGISTRATION_PATH);

    // TODO Verify key page elements
  });

  // Formats YOB/DOB correctly 

  // Blocks years below min year 

  // Blocks years above max year 

  it('registers a valid user', function (done) { 
    element(by.model('PatientRegCtrl.medical.last_name')).sendKeys(mockPatient.last_name);
    element(by.model('PatientRegCtrl.medical.middle_name')).sendKeys(mockPatient.middle_name);
    element(by.model('PatientRegCtrl.medical.first_name')).sendKeys(mockPatient.first_name);
  
    element(by.model('PatientRegCtrl.medical.hospital_no')).sendKeys(mockPatient.hospital_no);

    element(by.model('PatientRegCtrl.yob')).sendKeys(mockPatient.yob);

    var defaultOrigin = element(by.model('locationSelect.setOriginLocation.locationStore.village.value')).$('option:checked').getText();
    var defaultCurrent = element(by.model('locationSelect.setCurrentLocation.locationStore.village.value')).$('option:checked').getText();
  
    element(by.id('male')).click();

    element(by.id('submitPatient')).click();
  
    element(by.model('PatientRegCtrl.finance.debtor_group_uuid')).element(by.cssContainingText('option', 'Second Test Debtor Group')).click();
      
    element(by.id('submitPatient')).click();

    // expect(browser.getCurrentUrl()).to.eventually.contain(browser.baseUrl + '#/invoice/patient/');
    expect(browser.getCurrentUrl()).to.eventually.contain(browser.baseUrl + '#/invoice/patient/');
    // browser.pause();
  });

  // Async blocks hosptial numbers that are taken

});
