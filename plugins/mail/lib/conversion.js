/**
 * locale.js
 *
 * Manages number and currency conversion to i18n locales.
 * NOTE: this module renders values in the correct locale.  It provides
 * no exchange rates or other conversion schemes.
 */

var locales = {
  'en' : {
    symbol    : '$',
    separator : ',',
    decimal   : '.',
    alignment : 'left'
  },
  'fr' : {
    symbol    : 'FC',
    separator : '.',
    decimal   : ',',
    alignment : 'right'
  }
};

function currencyFC(value) {
  var symbol = 'FC',
      separator = '.',
      decimal = ',';

  var decimalDigits, template;

  // from application filter.js
  value = (value || 0).toFixed(2);
  decimalDigits = value.slice(value.indexOf('.')+1, value.indexOf('.') + 3);

  if (decimalDigits) { value = value.slice(0, value.indexOf('.')); }
  template = value.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1'+separator);
  template += decimal + decimalDigits + symbol;

  return template;

}

// expects a number and a language ('en' || 'fr')
exports.currency = function currency(value, locale) {
  'use strict';

  var properties = locales[locale],
      digits, template;

  if (!properties) {
    throw new Error('Locality %s not supported'.replace('%s', locale));
  }


  // convert value to string
  value = (value || 0).toFixed(2);

  // digits after decimal
  digits = value.slice(value.indexof('.') + 1, value.indexOf('.') + 3);

  if (digits) {
    value = value.slice(0, value.indexOf('.'));
  }

  template = value.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + properties.separator);

  // make sure the currency is correctly aligned
  if (properties.alignment == 'right') {
    template = properties.decimal + digits + properties.symbol;
  } else {
    template = properties.symbol + template;
    template += properties.decimal + digits;
  }

  return template;
};


exports.number = function number(value, locale) {
  'use strict';

  console.log('TODO');
};
