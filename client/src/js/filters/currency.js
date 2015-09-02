/*
 * BHIMA fork of native angular currency filter 
 * https://github.com/angular/angular.js/blob/master/src/ng/filter/filters.js
 * Built to support the following feature s
 *  - Logically seperate locale and currency, accounting cannot be based on language preference 
 *  - Accept currency key per individual filter
 *  - Fetch and cache currencies and formats from system database
 */
angular.module('bhima.filters') 
  
  .filter('currency', [
    '$locale',
    '$http',
    '$q',
    '$timeout',
    'store',
    function ($locale, $http, $q, $timeout, Store) { 
      var formats = $locale.NUMBER_FORMATS;
  
      var format = new CurrencyCache();

          
        
      // TODO Move to service 
      function CurrencyCache () { 
        
        var notReadyCache = [];
        console.log('CurrencyCache initiliased');
  
        var supportedCurrencies = new Store({identifier : 'id'});
        var currentFormats = new Store({identifier : 'format_key'});
        var fetchingKeys = [];

        var loadedSupportedCurrencies = false;

        $http.get('/finance/currencies')
        .success(function (data) {
          supportedCurrencies.setData(data);
          loadedSupportedCurrencies = true;

          // Request all currencies we've missed - this is stupid, it's late
          
          // var hit = []; 
          // notReadyCache.forEach(function (key) { 
          //   var miss = hit.indexOf(key) == -1;

          //   if (miss) { 
          //     hit.push(key);
          //     fetchFormatConfiguration(key);
          //   }
          // });
        })
        .error(function (error) {
          messenger.danger('An error occured:' + JSON.stringify(error));
        });

        function fetchFormatConfiguration(key) { 
          var formatObject = {};

          fetchingKeys[key] = true;

          $http.get('/i18n/currency/'.concat(key).concat('.json'))
            .success(function (result) { 
              formatObject = result;

              formatObject.supported = true;
              
              // TODO identifier could be in format file if required
              formatObject.format_key = key;
              console.log('got currency format', result);
              
              addFormat(formatObject);      
            })
            .catch(function (err) { 
              formatObject.supported = false;
              formatObject.format_key = key;

              console.log('ERRUR : ', err);

              addFormat(formatObject);
            });
        }

        function addFormat(formatObject) { 
          // FIXME Resolve issue with Store to just allow post. Github Ref: #
          if (angular.isUndefined(currentFormats.data.length)) { 
            currentFormats.setData([formatObject]);
          } else { 
            currentFormats.post(formatObject);
          }
        }

        function getFormat(currencyId) {

          // if (!loadedSupportedCurrencies) { 
          //   notReadyCache.push(key);
          //   return;
          // }
          var supportedCurrency = supportedCurrencies.get(currencyId);
  

          // TODO move supported object into variable
          if (angular.isUndefined(supportedCurrency)) { 
            return {
              supported : false
            }
          }
          var formatKey = supportedCurrency.format_key;
          var progress = fetchingKeys[formatKey];
    
          // console.log('ang test', angular.isUndefined(progress));

          if (!angular.isDefined(progress)) { 
            fetchFormatConfiguration(formatKey);
          }
          
          var format = currentFormats.get(formatKey);
          return format;
        }

        function fetchKey(key) { 

        }

        return { 
          request : getFormat,
          
          // TODO remove inline function
          ready : function () { 
            return loadedSupportedCurrencies;
          }
        }
      } // End CurrencyCache
              
      // targetLocale/ targetCurrency
      function handleFilter(amount, targetLocale, currencySymbol, fractionSize) {
        var formats = $locale.NUMBER_FORMATS; 
        if (angular.isUndefined(targetLocale)) { 

          // TODO Assign enterprise currency and warn user
          targetLocale = -1;
        }

        if (angular.isUndefined(currencySymbol)) {
          currencySymbol = formats.CURRENCY_SYM;
        }

        if (angular.isUndefined(fractionSize)) {
          fractionSize = formats.PATTERNS[1].maxFrac;
        }
        // console.log(targetLocale);
        
        // console.log('bhima currency');
        // console.log('patterns 1', formats.PATTERNS[1]);
        // console.log('group sep', formats.GROUP_SEP);
        // console.log('decimal sep', formats.DECIMAL_SEP);

        // FIXME hack
        // if (currency.get(targetLocale)) { 
          // formats.DECIMAL_SEP = currency.get(targetLocale).decimal;
          // currencySymbol = currency.get(targetLocale).symbol; 
        // } 
        // if null or undefined pass it through
        
        // $http.get('/finance/currencies').then(function (result) { 
          // return result; 
        // });
        
        // TODO sort out this logic 
        if (!format.ready()) { 
          return null;
        }
        
        // TODO Get enterprise currency from session 
        // TODO Pass option in here (hardcoded)
        var thisFormat = format.request(targetLocale);
      
        // TODO It's not sexy but it works - move these to descriptions 
        // var formatNotReady = thisFormat == null etc.
        if (amount === null) { 
          return null;
        }
        
        if (angular.isUndefined(thisFormat)) { 
          return "...";
        }

        if (thisFormat.supported === false) { 
          return 'CURRENCY_NOT_SUPPORTED('.concat(amount).concat(')');
        }
        
        return formatNumber(amount, thisFormat.PATTERNS[1], thisFormat.GROUP_SEP, thisFormat.DECIMAL_SEP, fractionSize).
            replace(/\u00A4/g, thisFormat.CURRENCY_SYM);
      }

      handleFilter.$stateful = true;
      
      return handleFilter;
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

// FIXME Method depreciated - move when all dependencies cleared
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

