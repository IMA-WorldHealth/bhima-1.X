
/*global describe, it, beforeEach, inject, browser */

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
var expect = chai.expect;

describe('patient registration', function () {

  beforeEach(function () {
    // navigate to the patient registration page
    browser.get('#/patient/register');
  });

  it('actually loads', function () {
    expect(browser.getCurrentUrl()).to.eventually.equal(browser.baseUrl + '#/patient/register');
  });

});
