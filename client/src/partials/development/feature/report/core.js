/**
 * @description 
 * Core report controller responsible for downloading report archives and
 * allowing the user to generate new reports 
 *
 * @todo 
 * Reports should be dynamically templated into the application routes, 
 * at this point there will be need to link the database report with the client
 * route
 *
 * @todo 
 * Replace report table with grid after grid analysis is performed (ui grid)
 *
 * @todo 
 * Decide on flexibility of URL structure. Current thoughts are 
 * report/{key}
 * report/{key}/{id}
 * report/{key}/generate
 * report/{key}/generate/{option_key}/{option_value}
 */
angular.module('bhima.controllers').controller('ReportCore', ReportCore);

ReportCore.$inject = ['$routeParams', 'ModuleState'];

function ReportCore($routeParams, ModuleState) { 
  
  // Anything assigned to the controller object will be exposed to the template (view)
  var viewModel = this;
  
  var state = new ModuleState();

  // TODO report routes and configuration should be defined in the database 
  // this relationship should be dynamically loaded and routes should implicitly 
  // be valid as they are data driven
  function legacyReportConfiguration() { 
    var reportMap = { 
      'balance' : { 
        title : 'Balance',
        generate_template : null,
        supports : null
      }
    };
  }

  /**
   * @params {Object} options Specify any initial options for the report, this 
   * can be default values passed sepecified in the URL
   */
  function requestReport(options) { 

  }

  // Expose state to the view model - allow selective displaying of elements
  viewModel.state = state;
}
