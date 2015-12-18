/*global describe, iit, element, by, ddescribe, it, beforeEach, inject, browser */

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
var expect = chai.expect;

var CashBoxPage = require('./cashboxes.page');

describe('The Cashbox Module', function () {

  var page = new CashBoxPage();

  var CASHBOX = {
    name : 'Test Principal Cashbox',
    type : 1,  // this is the position in the radio button "principal"
    project : 1
  };

  // navigate to the cashbox module before each test
  beforeEach(page.navigate);

  it('successfully creates a new cashbox', function () {

    // navigate to the create form
    page.create();

    page.input('CashCtrl.box.text', CASHBOX.name);
    page.radio('CashCtrl.box.type', CASHBOX.type);

    // select the first (non-disabled) option
    page.select('CashCtrl.box.project_id').get(1).click();

    // submit the page to the server
    page.submit();

    // make sure the success message shows
    page.exists(by.css('span.text-success'), true);

    // click the cancel button
    page.clear();

    // make sure the message is cleared
    page.exists(by.css('span.text-success'), false);

    // make sure the form is cleared
    page.exists(by.name('CreateForm'), false);
  });

  it('successfully edits a cashbox', function () {

    // navigate to the update form for the second item
    page.update(2);

    page.input('CashCtrl.box.text', CASHBOX.name);
    page.radio('CashCtrl.box.type', CASHBOX.type);

    // make sure no messages are displayed
    page.exists(by.css('span.text-success'), false);

    page.submit();

    // success message!
    page.exists(by.css('span.text-success'), true);
  });

  it('allows you to configure a currencies via a modal', function () {

    /*
    // navigate to the update form for the second item
    page.update(2);

    var currencies =
      element(by.repeater('currency in CashCtrl.currencies | orderBy:currency.name track by currency.id').get(0));

    // click the first currency button
    currencies.$$('a').click();

    // confirm that the modal appears
    expect(element(by.name('CashboxModalForm')).isPresent()).to.eventually.be.true;

    // begin filling in the modal
    page.select('CashboxModalCtrl.data.loss_exchange_account_id')
      .get(3).click();
    page.select('CashboxModalCtrl.data.gain_exchange_account_id')
      .get(3).click();
    page.select('CashboxModalCtrl.data.virement_account_id')
      .get(3).click();
    */

  });
});
