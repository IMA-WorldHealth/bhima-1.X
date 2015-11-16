
/*global describe, it, beforeEach, inject, browser */

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
var expect = chai.expect;

describe('patient registration', function () {
  
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
    hospital_no : 120,
  };

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

  it('registers a valid user', function () { 
    element(by.model('PatientRegCtrl.medical.last_name')).sendKeys(mockPatient.last_name);
    element(by.model('PatientRegCtrl.medical.middle_name')).sendKeys(mockPatient.middle_name);
    element(by.model('PatientRegCtrl.medical.first_name')).sendKeys(mockPatient.first_name);

    element(by.model('PatientRegCtrl.medical.yob')).sendKeys(mockPatient.yob);

    // element(by.model('locationSelect.setOriginLocation.village.value').
  });

  // Async blocks hosptial numbers that are taken

});
