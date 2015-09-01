/*
 * BHIMA fork of native angular currency filter 
 * https://github.com/angular/angular.js/blob/master/src/ng/filter/filters.js
 * Built to support the following feature s
 *  - Logically seperate locale and currency, accounting cannot be based on language preference 
 *  - Accept currency key per individual filter
 *  - Fetch and cache currencies and formats from system database
 */
console.log(angular);
console.log(angular.module);
angular.module('bhima.filters') 
  
  .filter('bhimaCurrency', [
    '$locale',
    '$http',
    'store',
    function ($locale, $http, Store) { 
      var formats = $locale.NUMBER_FORMATS;

      var currency = new Store({
        data : [],
        identifier : 'id'
      });

      $http.get('/finance/currencies')
      .success(function (data) {
        currency.setData(data);
      })
      .error(function (error) {
        messenger.danger('An error occured:' + JSON.stringify(error));
      });

              
      // targetLocale/ targetCurrency
      return function(amount, targetLocale, currencySymbol, fractionSize) {
        
        if (angular.isUndefined(targetLocale)) { 
          targetLocale = 1;
        }

        if (angular.isUndefined(currencySymbol)) {
          currencySymbol = formats.CURRENCY_SYM;
        }

        if (angular.isUndefined(fractionSize)) {
          fractionSize = formats.PATTERNS[1].maxFrac;
        }
        console.log(targetLocale);
        
        console.log('bhima currency');
        console.log('patterns 1', formats.PATTERNS[1]);
        console.log('group sep', formats.GROUP_SEP);
        console.log('decimal sep', formats.DECIMAL_SEP);

        // FIXME hack
        if (currency.get(targetLocale)) { 
          formats.DECIMAL_SEP = currency.get(targetLocale).decimal;
          currencySymbol = currency.get(targetLocale).symbol; 
        } 
        // if null or undefined pass it through
        return (amount == null)
          ? amount
          : formatNumber(amount, getLocaleCurrencyFormat(targetLocale), formats.GROUP_SEP, formats.DECIMAL_SEP, fractionSize).
            replace(/\u00A4/g, currencySymbol);
      };
    }
  ])

// Utility methods
// This method is copied directly from the angular repository. The method is
// a utility used by the native currency filter. 
var DECIMAL_SEP = '.';
function formatNumber(number, pattern, groupSep, decimalSep, fractionSize) {
  if (angular.isObject(number)) return '';

  var isNegative = number < 0;
  number = Math.abs(number);

  var isInfinity = number === Infinity;
  if (!isInfinity && !isFinite(number)) return '';

  var numStr = number + '',
      formatedText = '',
      hasExponent = false,
      parts = [];

  if (isInfinity) formatedText = '\u221e';

  if (!isInfinity && numStr.indexOf('e') !== -1) {
    var match = numStr.match(/([\d\.]+)e(-?)(\d+)/);
    if (match && match[2] == '-' && match[3] > fractionSize + 1) {
      number = 0;
    } else {
      formatedText = numStr;
      hasExponent = true;
    }
  }

  if (!isInfinity && !hasExponent) {
    var fractionLen = (numStr.split(DECIMAL_SEP)[1] || '').length;

    // determine fractionSize if it is not specified
    if (angular.isUndefined(fractionSize)) {
      fractionSize = Math.min(Math.max(pattern.minFrac, fractionLen), pattern.maxFrac);
    }

    // safely round numbers in JS without hitting imprecisions of floating-point arithmetics
    // inspired by:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round
    number = +(Math.round(+(number.toString() + 'e' + fractionSize)).toString() + 'e' + -fractionSize);

    var fraction = ('' + number).split(DECIMAL_SEP);
    var whole = fraction[0];
    fraction = fraction[1] || '';

    var i, pos = 0,
        lgroup = pattern.lgSize,
        group = pattern.gSize;

    if (whole.length >= (lgroup + group)) {
      pos = whole.length - lgroup;
      for (i = 0; i < pos; i++) {
        if ((pos - i) % group === 0 && i !== 0) {
          formatedText += groupSep;
        }
        formatedText += whole.charAt(i);
      }
    }

    for (i = pos; i < whole.length; i++) {
      if ((whole.length - i) % lgroup === 0 && i !== 0) {
        formatedText += groupSep;
      }
      formatedText += whole.charAt(i);
    }

    // format fraction part.
    while (fraction.length < fractionSize) {
      fraction += '0';
    }

    if (fractionSize && fractionSize !== "0") formatedText += decimalSep + fraction.substr(0, fractionSize);
  } else {
    if (fractionSize > 0 && number < 1) {
      formatedText = number.toFixed(fractionSize);
      number = parseFloat(formatedText);
    }
  }

  if (number === 0) {
    isNegative = false;
  }

  parts.push(isNegative ? pattern.negPre : pattern.posPre,
             formatedText,
             isNegative ? pattern.negSuf : pattern.posSuf);
  return parts.join('');
} 

// Temporary function to map locales to currencies 
// TODO move all currency format information into currency table OR define 
//      all currency formatting through locale 
function getLocaleCurrencyFormat(currencyId) { 
  
  var en_us =
  {
    "gSize": 3,
    "lgSize": 3,
    "maxFrac": 2,
    "minFrac": 2,
    "minInt": 1,
    "negPre": "-",
    "negSuf": "\u00a0\u00a4",
    "posPre": "",
    "posSuf": "\u00a0\u00a4"
  };

  var fr_cd = 
  {
    "gSize": 3,
    "lgSize": 3,
    "maxFrac": 2,
    "minFrac": 2,
    "minInt": 1,
    "negPre": "-\u00a4",
    "negSuf": "",
    "posPre": "\u00a4",
    "posSuf": ""
  };

  var map = {
    '1' : en_us, 
    '2' : fr_cd
  };

  return map[currencyId];
}

