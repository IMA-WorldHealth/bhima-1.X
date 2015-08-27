/**
 * locale.js
 *
 * Manages number and currency conversion to i18n locales.
 * NOTE: this module renders values in the correct locale.  It provides
 * no exchange rates or other conversion schemes.
 */

var locales = {
  'en' : {
    symbol    : '$ ',
    separator : ',',
    decimal   : '.',
    alignment : 'left'
  },
  'fr' : {
    symbol    : ' FC',
    separator : '.',
    decimal   : ',',
    alignment : 'right'
  }
};

// expects a number and a language ('en' || 'fr')
exports.currency = function currency(values, locale) {
  'use strict';

  var properties = locales[locale],
      digits, template;

  if (!properties) {
    throw new Error('Locality %s not supported'.replace('%s', locale));
  }

  values.forEach(function (value){
    // convert value to string
    value.total = (value.total || 0).toFixed(2);

    // digits after decimal
    digits = value.total.slice(value.total.indexOf('.') + 1, value.total.indexOf('.') + 3);

    if (digits) {
      value.total = value.total.slice(0, value.total.indexOf('.'));
    }

    template = value.total.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + properties.separator);

    // make sure the currency is correctly aligned
    if (properties.alignment == 'right') {
      template += properties.decimal + digits + properties.symbol;
    } else {
      template = properties.symbol + template;
      template += properties.decimal + digits;
    }

    value.total = template;
  });

  return values;
};


// TODO - make number rendering abide by country conventions
exports.number = function number(value, locale) {
  'use strict';
  return value;
};


// TODO - make a date converter
exports.date = function date(value, format) {
  'use strict';

  var bool = value instanceof Date;

  // try to convert number to a date
  if (!bool) { value = new Date(value); }

  return value.toLocaleString();
};
