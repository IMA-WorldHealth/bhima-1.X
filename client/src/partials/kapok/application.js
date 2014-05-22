angular.module('bhima.controllers')
.controller('app', [
  '$location',
  '$translate',
  'appcache',
  'appstate',
  'connect',
  'validate',
  function($location, $translate, Appcache, appstate, connect) {

    window.connect = connect; // FIXME : for testing

    var moduleNamespace = 'application',
      dependencies = {},
      cache = new Appcache(moduleNamespace);

    dependencies.enterprise = {
      required : true,
      query : {
        'tables' : {
          'enterprise' : {
            'columns' : ['id', 'name', 'phone', 'email', 'location_id', 'currency_id']
          }
        }
      }
    };

    dependencies.fiscal = {
      query : {
        'tables' : {
          'period' : {
            'columns' : ['id', 'period_start', 'period_stop', 'fiscal_year_id']
          },
          'fiscal_year' : {
            'columns': ['fiscal_year_txt', 'start_month', 'start_year', 'previous_fiscal_year', 'enterprise_id']
          }
        },
        join : ['period.fiscal_year_id=fiscal_year.id'],
        where : ['period.period_start<=' + mysqlDate(), 'AND', 'period.period_stop>=' + mysqlDate()]
      }
    };

    dependencies.exchange = {
      query : {
        'tables' : {
          'exchange_rate' : {
            'columns' : ['id', 'enterprise_currency_id', 'foreign_currency_id', 'rate', 'date']
          }
        },
        'where' : ['exchange_rate.date='+mysqlDate()]
      }
    };

    var queryEnterprise = {
      'tables' : {
        'enterprise' : {
          'columns' : ['id', 'name', 'phone', 'email', 'location_id', 'currency_id']
        }
      }
    };

    var queryFiscal = {
      'tables' : {
        'period' : { 'columns' : ['id', 'period_start', 'period_stop', 'fiscal_year_id'] },
        'fiscal_year' : { 'columns': ['fiscal_year_txt', 'start_month', 'start_year', 'previous_fiscal_year', 'enterprise_id'] }
      },
      join : ['period.fiscal_year_id=fiscal_year.id'],
      where : ['period.period_start<=' + mysqlDate(), 'AND', 'period.period_stop>=' + mysqlDate()]
    };

    var queryExchange = {
      'tables' : {
        'exchange_rate' : {
          'columns' : ['id', 'enterprise_currency_id', 'foreign_currency_id', 'rate', 'date']
        }
      },
      // 'where' : ['exchange_rate.date='+mysqlDate()]
    };

    var queryCurrency = {
      'tables' : {
        'currency' : {
          'columns' : ['id', 'name', 'symbol', 'min_monentary_unit']
        }
      }
    };

    var queryProject = '/currentProject';

    function settupApplication() {
      var url = $location.url();

      //TODO experimental - loading previous sessions language settings - not always ideal during development
      loadLanguage();

      //Initial page load assumed be navigating to nothing
      if(url==='' || url==='/') { loadCachedLocation(); }
      fetchSessionState();
    }

    settupApplication();

    function loadCachedLocation() {
      cache.fetch('location').then(function(res) {
        if (res) { $location.path(res.path); }
      }, handleError);
    }

    function loadLanguage() {

      //FIXME This could be done in util.js - extra object (in this file) vs. the clarity of doing all set up in one place
      var utilCache = new Appcache('util');
      utilCache.fetch('language').then(function(res) {
        if (res) { $translate.use(res.current); }
      });
    }

    function setUser(user) {
      appstate.set('user', user.data);
    }

    //Slightly more verbose than the inline equivalent but I think it looks cleaner
    //TODO: transition this to using validate
    function fetchSessionState() {
      loadEnterprise()
      .then(setEnterpriseLoadFiscal)
      .then(setFiscalLoadExchange)
      .then(setExchange)
      .then(setProject)
      .then(setCurrency)
      .then(setUser)
      .catch(handleError)
      .finally();
    }

    function loadEnterprise() {
      return connect.req(queryEnterprise);
    }

    function setEnterpriseLoadFiscal(result) {
      var defaultEnterprise = result.data[0];
      if (defaultEnterprise) { appstate.set('enterprise', defaultEnterprise); }

      return connect.req(queryFiscal);
    }

    function setFiscalLoadExchange(result) {
      var currentFiscal = result.data[0];

      //TODO improve mini hack with aliasing in query etc.
      if(currentFiscal) {
        currentFiscal.period_id = currentFiscal.id;
        currentFiscal.id = currentFiscal.fiscal_year_id;
        appstate.set('fiscal', currentFiscal);
      }
      return connect.req(queryExchange);
    }

    function setExchange(result) {
      if(result) { appstate.set('exchange_rate', result.data); }
      return connect.fetch(queryProject);
    }

    function setProject(result) {
      if (result) { appstate.set('project', result.data); }
      return connect.req(queryCurrency);
    }

    function setCurrency(result) {
      if (result) { appstate.set('currency', result.data); }
      return connect.req('/user_session');
    }

    function handleError(error) {
      throw error;
    }

    function mysqlDate (date) {
      return (date || new Date()).toISOString().slice(0,10);
    }
  }
]);
