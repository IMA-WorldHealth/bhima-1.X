angular.module('kpk.controllers')
.controller('appController', function($scope, $location, $translate, appcache, appstate, connect) { 
  var moduleNamespace = 'application', cache = new appcache(moduleNamespace);
  
  var queryEnterprise = {
    'tables' : { 
      'enterprise' : {
        'columns' : ['id', 'name', 'phone', 'email', 'location_id', 'currency_id'] }
    }
  };
  
  var queryFiscal = {
    'tables' : { 
      'period' : { 'columns' : ['id', 'period_start', 'period_stop', 'fiscal_year_id'] },
      'fiscal_year' : { 'columns': ['fiscal_year_txt', 'start_month', 'start_year', 'previous_fiscal_year', 'enterprise_id'] }
    },
    join : ['period.fiscal_year_id=fiscal_year.id'],
    where : ["period.period_start<" + mysqlDate(), "AND", "period.period_stop>" + mysqlDate()] 
  };

  var queryExchange = {
    'tables' : { 
      'exchange_rate' : { 
        'columns' : ['id', 'enterprise_currency_id', 'foreign_currency_id', 'rate', 'date'] }
    },
    'where' : ['exchange_rate.date='+mysqlDate()]
  };

  settupApplication();  
  
  function settupApplication() { 
    var url = $location.url();
    
    //TODO experimental - loading previous sessions language settings - not always ideal during development
    loadLanguage();

    //Initial page load assumed be navigating to nothing
    if(url==='' || url==='/') loadCachedLocation(); 
    fetchSessionState();
  }
   
  function loadCachedLocation() { 
    cache.fetch('location').then(function(res) { 
      if(res) $location.path(res.path);
    }, handleError);
  }

  function loadLanguage() { 
    
    //FIXME This could be done in util.js - extra object (in this file) vs. the clarity of doing all set up in one place
    var utilCache = new appcache('util');
    utilCache.fetch('language').then(function(res) { 
      if(res) $translate.uses(res.current); 
    });
  }

  //Slightly more verbose than the inline equivalent but I think it looks cleaner
  function fetchSessionState() { 
    loadEnterprise().then(setEnterpriseLoadFiscal).then(setFiscalLoadExchange).then(setExchange, handleError);
  }

  function loadEnterprise() { 
    return connect.req(queryEnterprise);
  }

  function setEnterpriseLoadFiscal(result) { 
    var defaultEnterprise = result.data[0];
    if(defaultEnterprise) appstate.set('enterprise', defaultEnterprise);

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
    var currentExchange = result.data[0];
    if(currentExchange) appstate.set('exchange_rate', currentExchange);
  }

  function handleError(error) { 
    throw error;
  }
  
  //Watch changes in application $location, cache these in the user's session
  $scope.$on('$locationChangeStart', function(e, n_url) { 
    
    //TODO Tree is not currently updated on navigation - user can be presented with a different screen than selected node
    //Split url target - needs to be more general to allow for multiple routes?
    var target = n_url.split('/#')[1];
    if(target) cache.put("location", {path: target});
  });

 function mysqlDate (date) {
    return (date || new Date()).toISOString().slice(0,10);
  }
});
