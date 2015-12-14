/* global browser, by, element */

// NOTE - The $(...) method is a shortcut for element(by.css(...))
// NOTE - these are functions to be reusable between pages in the future
var buttons =  {
  add : function addButton() { return $('#create'); },
  submit : function submitButton() { return $('form button[type=submit]'); },
  cancel : function cancelButton() { return $('form button#cancel'); }
};

// various form utilities
var formUtils = {

  // get an <input> element by its ng-model
  input : function input(model, value) {
    element(by.model(model)).sendKeys(value); 
  },

  // get a <select> element by its ng-options
  select: function select(options) {
    return element.all(by.options(options));
  }
};

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
    buttons.add.click();
  };

  // submits the current form
  this.submit = function submit() {
    buttons.submit.click();
  };

  // navigates to the update form by clicking the update button on the nth row
  this.update = function update(n) {
    var elements = element(by.repeater('box in CashCtrl.cashboxes track by box.id'));
    return elements.row(n).$$('a').click();
  };

};
