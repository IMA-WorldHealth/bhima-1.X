'use strict' 

/**
 * @description
 * Very simple service to define state variables that are common to most
 * modules but are defined under different names and structures
 *
 * @returns {object} Getters and Setters for common modules states
 */

angular.module('bhima.services').factory('ModuleState', ModuleState);
    
function ModuleState () { 
  
  function Session () { 
    this.__initialised = false;
    this.__loading = true;

  };

  Session.prototype.isInitialised = function () { 
    return this.__initialised;
  }

  return Session;
};
