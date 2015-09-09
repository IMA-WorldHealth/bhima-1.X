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
angular.module('bhima.controllers').controller('ReportCore', ['ModuleState', ReportCore]);

// ReportCore.$inject = ['ModuleState'];

function ReportCore(ModuleState) { 
  
  // Anything assigned to the controller object will be exposed to the template (view)
  var viewModel = this;
  
  viewModel.state = new ModuleState();
  
  /**
   * @params {Object} options Specify any initial options for the report, this 
   * can be default values passed sepecified in the URL
   */
  function requestReport(options) { 

  }
}
