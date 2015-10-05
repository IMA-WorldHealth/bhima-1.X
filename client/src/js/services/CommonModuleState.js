'use strict' 

/**
 * @description
 * Very simple service to define state variables that are common to most
 * modules but are defined under different names and structures. This service is
 * essentially a semantic wrapper around many common states.
 *
 * @returns {object} Getters and Setters for common modules states
 *
 * @todo Refactor API to remove redundant states
 *
 * @todo Using getters and setters to semantically expose variables may be more
 * costly than it is worth, this should be investigated
 */

angular.module('bhima.services').factory('ModuleState', ModuleState);
    
ModuleState.$inject = ['$timeout'];

function ModuleState ($timeout) { 
  
  function Session () { 

    // Components relying on this should not assume invalid as default
    this.__valid = undefined;
    this.__success = undefined;

    this.__complete = false;
    this.__initialised = false;
    this.__loading = false;

    // Expose available properties
    Object.defineProperty(this, 'isValid', { 
      get : function isValid() { 
        return this.__valid;
      }
    });

    Object.defineProperty(this, 'isInvalid', { 
      get : function isInvalid() { 

        if (angular.isUndefined(this.__valid)) { 
          return this.__valid;
        }
        return !this.__valid;
        }
    });
    
    Object.defineProperty(this, 'isLoading', { 
      get : function isLoading() { 
        return this.__loading;
      }
    });

    Object.defineProperty(this, 'notLoading', { 
      get : function notLoading() { 
        return !this.__loading;
      }
    });

    Object.defineProperty(this, 'isComplete', { 
      get : function isComplete() { 
        return this.__complete;
      }
    });

    Object.defineProperty(this, 'notComplete', { 
      get : function notComplete() { 
        return !this.__complete;
      }
    });

    Object.defineProperty(this, 'moduleSuccess', { 
      get : function moduleSuccess() { 
        return this.__success;
      }
    });
   
    Object.defineProperty(this, 'moduleFailed', { 
      get : function moduleFailed() { 

        if (angular.isUndefined(this.__success)) { 
          return this.__success;
        }
        return !this.__success;
        }
    });

  };
  
  // TODO Rewrite prototype methods as getters + setters
  Session.prototype.validateModule = function () { 
    this.__valid = true;
  }

  Session.prototype.invalidateModule = function () { 
    this.__valid = false;
  }
  
  Session.prototype.isInitialised = function () { 
    return this.__initialised;
  }

  Session.prototype.loaded = function () { 
    this.__loading = false;
    return this.__loading;
  }

  Session.prototype.loading = function () { 
    this.__loading = true;
    return this.__loading;
  }

  Session.prototype.completed = function () { 
    this.__complete = true;
    return this.__complete;
  }
  
  Session.prototype.success = function () { 
    this.__success = true;
    return this.__success;
  }

  Session.prototype.failed = function () { 
    this.__success = false;
    return this.__success;
  }
  return Session;
};
