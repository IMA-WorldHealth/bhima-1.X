/**
 * @todo Too much responsability is given to report document generate button - this should be handled by the service 
 *
 * @todo Update to use single updated report data API
 */
angular.module('bhima.controllers').controller('SalesRecords', SalesRecords);
  
SalesRecords.$inject = ['$timeout','$translate', '$modal', 'util','validate', 'ReportService'];

function SalesRecords($timeout, $translate, $modal, util, validate, ReportService) { 
  
  // TODO add search (filter)
  // TODO add sortable (clickable) columns
  var dependencies = {};
  var viewModel = this; 
  
  var period = viewModel.period = [
    {
      key : 'CASH_PAYMENTS.DAY',
      method : today
    },
    {
      key : 'CASH_PAYMENTS.WEEK',
      method : week
    },
    {
      key : 'CASH_PAYMENTS.MONTH',
      method : month
    }
  ];

  var session = viewModel.session = {
    param : {},
    searching : true
  };

  var total = viewModel.total = {
    method : {
      'sales' : totalSales,
      'patients' : totalPatients,
      'cost' : totalCost
    },
    result : {}
  };
  
  /*
   * Report document generation state
   */
  var serverInterface = ReportService;
  
  // TODO This variable should be driven by client route (app.js) according to the new report data API 
  var reportKey = 'patient_invoices';
 
  // serverInterface can be assumed loaded because of route resolve dependency (this should be documented somewhere)
  var reportDefinition = serverInterface.requestDefinition(reportKey);

  dependencies.sale = {};
  dependencies.project = {
    query : {
      tables : {
        project : {
          columns : ['id', 'abbr', 'name']
        }
      }
    }
  };

  dependencies.user_sale = {
    query : {
      tables : {
        'sale' : { columns : ['seller_id'] },
        'user' : {columns : ['id', 'first', 'last'] }
      },
      distinct : true,
      join : ['sale.seller_id=user.id']
    }
  };

  $timeout(init, 100);

  function init() {
    validate.process(dependencies, ['project', 'user_sale']).then(loadProjects);
  }

  function loadProjects(model) {
    viewModel.model = model;
    // session.project = model.project.data[0].id;

    // TODO Determine best way to wait for page load before requesting data
    select(period[0]);
  }

  function select(period) {
    session.selected = period;
    period.method();
  }

  function updateSession(model) {
    viewModel.model = model;
    updateTotals();
    session.searching = false;
  }

  function reset() {
    var request;

    request = {
      dateFrom : util.sqlDate(session.param.dateFrom),
      dateTo : util.sqlDate(session.param.dateTo),
    };

    if (!isNaN(Number(session.project))) {
      request.project = session.project;
    }

    if (!isNaN(Number(session.user))) {
      dependencies.user = {
        query : {
          tables : {
            'user' : {columns : ['id', 'first', 'last'] }
          },
           where : [
            'user.id=' + session.user
          ]        
        }
      };
      validate.process(dependencies, ['user'])
      .then(function (model) {
        var userData = model.user.data[0];
        viewModel.userSelected = userData.first + ' - ' + userData.last;
      });          
      request.user = session.user;
    } else {
      viewModel.userSelected = $translate.instant('SALERECORD.ALL_USERS');
    }

    session.searching = true;
    dependencies.sale.query = '/reports/saleRecords/?' + JSON.stringify(request);

    total.result = {};
    if (viewModel.model.sale) {
      viewModel.model.sale.data = [];
    }
    validate.refresh(dependencies, ['sale']).then(updateSession);
  }

  function today() {
    viewModel.session.param.dateFrom = new Date();
    viewModel.session.param.dateTo = new Date();
    // viewModel.session.param.dateTo.setDate(viewModel.session.param.dateTo.getDate() - 1);
    reset();
  }

  viewModel.format = function format(user) {
    return [user.first, user.last].join(' - ');
  };

  function week() {
    viewModel.session.param.dateFrom = new Date();
    viewModel.session.param.dateTo = new Date();
    viewModel.session.param.dateFrom.setDate(viewModel.session.param.dateTo.getDate() - viewModel.session.param.dateTo.getDay());

    reset();
  }

  function month() {
    viewModel.session.param.dateFrom = new Date();
    viewModel.session.param.dateTo = new Date();
    viewModel.session.param.dateFrom.setDate(1);
    reset();
  }

  function updateTotals() {
    for (var key in total.method) {
      total.result[key] = total.method[key]();
    }
  }

  function totalSales() {
    return viewModel.model.sale.data.length;
  }

  function totalPatients() {
    var total = 0, evaluated = {};

    viewModel.model.sale.data.forEach(function (sale) {
      if (evaluated[sale.debitor_uuid]) { return; }
      total++;
      evaluated[sale.debitor_uuid] = true;
    });

    return total;
  }

  function totalCost() {
    return viewModel.model.sale.data.reduce(function (a, b) {
      if(!b.creditId){
        return a + b.cost;  
      } else {
        return a + 0;  
      }

    }, 0);
  }

  function requestDocument() { 
    var templateByConvention = serverInterface.resolveTemplatePath(reportDefinition.key); 
    var controllerByConvention = serverInterface.resolveController(reportDefinition.key);
    
    var modal = $modal
      .open({
      
        // Disable interaction with page behind
        backdrop : 'static',
        keyboard : false,
        templateUrl : templateByConvention,
        controller : controllerByConvention,
        resolve : { 
          definition : function () { 
            return reportDefinition;
          }, 
          updateMethod : function () { 

            // No archives will be updated
            return function (){};
          }, 
          referenceOptions : function () { 
            return session.param;
          }
        }
      });

    modal.result.then(function (completeConfirmation) { 
      // Report submitted 
    
    }, function (error) { 
       
      // TODO formalise this
      console.error('Report is NOT configured correctly');
      console.error(error);
    });

  }
  
  viewModel.requestDocument = requestDocument;
  viewModel.select = select;
  viewModel.reset = reset;
}
