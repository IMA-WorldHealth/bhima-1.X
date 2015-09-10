'use strict' 

/**
 * @description
 * Very simple service to define state variables that are common to most
 * modules but are defined under different names and structures. This service is
 * essentially a semantic wrapper around many common states.
 *
 * @returns {object} Getters and Setters for common modules states
 *
 * @todo Using getters and setters to semantically expose variables may be more
 * costly than it is worth, this should be investigated
 */

angular.module('bhima.services').factory('ModuleState', ModuleState);
    
function ModuleState () { 
  
  function Session () { 

    // Components relying on this should not assume invalid as default
    this.__valid = null;
    
    this.__initialised = false;
    this.__loading = true;
    
    // Expose available properties
    Object.defineProperty(this, 'isValid', { 
      get : function isValid() { 
        console.log('isValid');
        return this.__valid;
      }
    });

    Object.defineProperty(this, 'isInvalid', { 
      get : function isInvalid() { 

        if (this.__valid === null) { 
          return this.__valid;
        }
        return !this.__valid;
        }
    });
  };

  Session.prototype.validateModule = function () { 
    this.__valid = true;
  }

  Session.prototype.invalidateModule = function () { 
    this.__valid = false;
  }
  
  Session.prototype.isInitialised = function () { 
    return this.__initialised;
  }
  
  
  return Session;
};
