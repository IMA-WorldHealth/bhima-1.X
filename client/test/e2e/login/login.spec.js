/*global describe, it, beforeEach, inject, browser */

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
var expect = chai.expect;

describe('bhima login page', function () {

  it('rejects an undefined user', function () {

    browser.get('https://localhost:8080/#/login');

    element(by.model('LoginCtrl.credentials.username')).sendKeys('undefineds');
    element(by.model('LoginCtrl.credentials.password')).sendKeys('undefined1');

    element(by.id('submit')).click();

    expect(element(by.css('.help-block')).isPresent()).to.eventually.be.true;
  });

});
