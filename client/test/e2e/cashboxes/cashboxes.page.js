/* global browser, by, element */

// NOTE - The $(...) method is a shortcut for element(by.css(...))
// NOTE - these are functions to be reusable between pages in the future

// various form utilities
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
var expect = chai.expect;

var utils = require('../shared/FormUtils');

module.exports = function CashboxPage() {
  'use strict';

  // URL to the cashboxes
  var path = '#/cashboxes';

  // navigate to the cash box page
  this.navigate = function navigate() {
    browser.get(path);
  };

  // navigates to the creation form
  this.create = function create() {
    utils.buttons.create().click();
  };

  this.clear = function clear() {
    utils.buttons.cancel().click();
  };

  // submits the current form
  this.submit = function submit() {
    utils.buttons.submit().click();
  };

  // asserts whether an element exists or not
  this.exists = function exists(locator, bool) {
    expect(element(locator).isPresent()).to.eventually.equal(bool);
  };

  // TODO -- move these into a separate utility file
  this.input = utils.input;
  this.radio = utils.radio;
  this.select = utils.select;

  // navigates to the update form by clicking the update button on the nth row
  this.update = function update(n) {
    return element(by.repeater('box in CashCtrl.cashboxes track by box.id').row(n))
      .$$('a')
      .click();
  };

};
