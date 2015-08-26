/*global describe, it, beforeEach, inject, browser */

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;

describe('bhima login page', function () {

  beforeEach(function () {
     browser.get('https://localhost:8080/#/login');
  });

  it('redirects to the /login page on start up', function () {
   browser.get('https://localhost:8080/#/nottheloginpage');

   console.log(browser.getCurrentUrl());
   expect(browser.getCurrentUrl()).to.equal('http://localhost:8080/#/login')
  });


  it('rejects an undefined user', function () {

    element(by.model('LoginCtrl.credentials.username')).sendKeys('undefineds');
    element(by.model('LoginCtrl.credentials.password')).sendKeys('undefined1');

    element(by.id('submit')).click();

    expect(element(by.css('.help-block')).isPresent()).to.be.false;
  });

});
