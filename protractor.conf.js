/* global by,browser,element */

var q = require('q');

exports.config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',

  // configuration for running on SauceLabs
  sauceUser: process.env.SAUCE_USERNAME,
  sauceKey: process.env.SAUCE_ACCESS_KEY,

  multiCapabilities: [{
    'browserName': 'firefox',
     'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
  }, {
    'browserName': 'chrome',
     'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
  }],

  specs: ['client/test/e2e/**/*.spec.js'],

  framework : 'mocha',
  baseUrl : 'https://localhost:8080/',
  allScriptsTimeout : 30000,

  // this will log the user in to begin with
  onPrepare : function () {
    return q.fcall(function () {
      browser.get('https://localhost:8080/#/login');

      element(by.model('LoginCtrl.credentials.username')).sendKeys('test');
      element(by.model('LoginCtrl.credentials.password')).sendKeys('test');
      element(by.id('submit')).click();

      // NOTE - you may need to play with the delay time to get this to work properly
      // Give this plenty of time to run
    }).delay(3100);
  }
};
