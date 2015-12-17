/* global browser, by, element */

var buttons =  {
  create : function create() { return element(by.id('create')); },
  submit : function submit() { return $('form button[type=submit]'); },
  cancel : function cancel() { return $('form button[ng-click="CashCtrl.cancel()"]'); }
};

module.exports = {

  // get an <input> element by its ng-model
  input : function input(model, value) {
    return element(by.model(model)).sendKeys(value);
  },

  // get a <select> element by its ng-model.
  select: function select(model) {
    return element(by.model(model)).all(by.tagName('option'));
  },

  // get a radio button by its position and click
  radio : function radio(model, n) {
    return element.all(by.model(model)).get(n).click();
  },

  buttons: buttons,
};
