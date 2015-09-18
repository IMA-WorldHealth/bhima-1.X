angular.module('bhima.controllers')
.controller('ApplicationController', [
  '$location',
  '$timeout',
  '$translate',
  'appcache',
  'appstate',
  'connect',
  'util',
  'SessionService',
  'tmhDynamicLocale',
  function ($location, $timeout, $translate, Appcache, appstate, connect, util, SessionService, tmhDynamicLocale) {

    // useful for loading the language
    var cache = new Appcache('preferences');

    cache.fetch('language')
    .then(function (language) {

      if (language) {
        
        // Use previously set language
        // TODO Use a translation service to fetch languages and configure cache
        $translate.use(language.translate_key);
        tmhDynamicLocale.set(language.locale_key);
      } else { 
        
        // FIXME SessionService values _cannot_ be relied upon unless the user has 
        // already logged in once - they cannot be used on initial load
        if (SessionService.enterprise) { 

          connect.req('languages')
          .then(function (languageStore) { 
            var enterpriseLanguage = languageStore.get(SessionService.enterprise.language_id);
            
            // TODO Use a translation service to fetch languages and configure cache
            // Default to enterprise language
            $translate.use(enterpriseLanguage.translate_key);
            tmhDynamicLocale.set(enterpriseLanguage.locale_key);
            cache.put('language', enterpriseLanguage);
          });
        }
      }
    });

    this.isLoggedIn = function () {
      return SessionService.user;
    };

    if (this.isLoggedIn()) {
      loadState();
    }

    // loads dependencies used by the application during runtime
    //   FiscalYear
    //   ExchangeRate
    //   Currencies
    // Also contains a hack to make sure the appstate has the correct
    // enterprise, user, and project from SessionService
    function loadState() {
      var currencies, exchangeRate, fiscalYear;

      exchangeRate = {
        'tables' : {
          'exchange_rate' : {
            'columns' : ['id', 'enterprise_currency_id', 'foreign_currency_id', 'rate', 'date']
          }
        }
      };

      fiscalYear = {
        'tables' : {
          'period' : { 'columns' : ['id', 'period_start', 'period_stop', 'fiscal_year_id'] },
          'fiscal_year' : { 'columns': ['fiscal_year_txt', 'start_month', 'start_year', 'previous_fiscal_year', 'enterprise_id'] }
        },
        join : ['period.fiscal_year_id=fiscal_year.id'],
        where : ['period.period_start<=' + util.sqlDate(), 'AND', 'period.period_stop>=' + util.sqlDate()]
      };

      currencies = {
        'tables' : {
          'currency' : {
            'columns' : ['id', 'name', 'symbol', 'min_monentary_unit']
          }
        }
      };

      // set appstate variables
      // TODO : Loading exchange rates should be moved into a service
      // where only the pages needing exchange rates load them.
      setEnvironmentVariable('fiscalYears', fiscalYear);
      setEnvironmentVariable('currencies', currencies);
      setEnvironmentVariable('exchange_rate', exchangeRate);

      // FIXME hack to make sure that appstate has user,
      // project, and enterprise defined
      $timeout(function () {
        appstate.set('enterprise', SessionService.enterprise);
        appstate.set('project', SessionService.project);
        appstate.set('user', SessionService.user);
      });

      // set DEPRECATED appstate variables until we can change them
      // throughout the application.
      appstate.register('fiscalYears', function (data) {
        var currentFiscal = data[0];
        if (currentFiscal) {
          currentFiscal.period_id = currentFiscal.id;
          currentFiscal.id = currentFiscal.fiscal_year_id;
          appstate.set('fiscal', currentFiscal);
        }
      });
    }

    // utility function to set appstate() variables
    function setEnvironmentVariable(key, data) {
      connect.fetch(data)
      .then(function (values) {
        $timeout(function () {
          appstate.set(key, values);
        });
      });
    }
  }
]);
