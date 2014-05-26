// liberror.js
//
// This service is responsible for namespacing and both capturing
// and throwing errors.
//
// Usage:
// var httpError = liberror.namespace('HTTP');
//
// // Throw error 302
// promise.then().catch(httpError.throw(302));
//
// // or capture and try to interpret error
// promise.then().catch(httpError.capture);

angular.module('bhima.services')
.factory('liberror', ['$http', '$log', 'messenger', function ($http, $log, messenger) {

  var errorCodes = {
    0 : {
      'title' : 'Unknown Error',
      'ref'   : '0',
      'tmpl'  : 'An unknown error occured.  Server returned {0}'
    }
  };

  (function loadErrorCodes() {
    $http.get('/errorcodes')
    .success(function (data) {
      angular.extend(errorCodes, data);
    })
    .error(function (err) {
      messenger.danger(JSON.stringify(err));
    });
  })();

  (function loadErrorCodes() {
    $http.get('/errorcodes')
    .success(function (data) {
      errorCodes = data;
    })
    .error(function (err) {
      messenger.danger(JSON.stringify(err));
    });
  })();

  function CustomError (code, namespace, message) {
    var args, err = Error.call(this, message);
    err.code = code;
    err.namesace = namespace;
    args = Array.prototype.slice.call(arguments);
    err.params = args.slice(3);
    return err;
  }

  function stringify (obj) {
    if (typeof obj === 'function') {
      return obj.toString().replace(/ \{[\s\S]*$/, '');
    } else if (typeof obj === 'undefined') {
      return 'undefined';
    } else if (typeof obj !== 'string') {
      return JSON.stringify(obj);
    }
    return obj;
  }

  function templateMessage() {
    var template = arguments[0],
      templateArgs = arguments,
      message;

    message = template.replace(/\{\d+\}/g, function (match) {
      var index = +match.slice(1, -1), arg;

      if (index + 1 < templateArgs.length) {
        arg = templateArgs[index + 1];
        if (typeof arg === 'function') {
          return arg.toString().replace(/ ?\{[\s\S]*$/, '');
        } else if (typeof arg === 'undefined') {
          return 'undefined';
        } else if (typeof arg !== 'string') {
          return stringify(arg);
        }
        return arg;
      }
      return match;
    });

    return message;
  }

  return {
    namespace : function (module) {
      // AngularJS style of formatting parameters
      return {
        throw : function () {
          var code = arguments[0],
            err = errorCodes[code] || errorCodes['0'],
            prefix = '[' + (module ? module + ':' : '') + code + '] ',
            args,
            title, message;

          title = prefix + err.title;
          args = Array.prototype.slice.call(arguments);
          message = templateMessage.call(this, args.slice(1));

          $log.debug('Title is: ', title);
          $log.debug('Template is: ', message);

          // FIXME: this can be re-written as a custom error object
          return new CustomError(code, module, message);
        },
        capture : function (err) {
          $log.debug('NameSpace', module);
          $log.debug('debugging', err);

          if (err.status && err.data.sqlState) {
            // This is a mysql error
            // format error
            var error = errorCodes.ERR_DATABASE;
            var template = error.tmpl;

            template = templateMessage(template, err.data.code, err.config.url);

            $log.debug('template : ', template);

            angular.extend(error, {
              namespace   : module,
              status      : err.status,
              statusText  : err.statusText,
              description : template
            });

            $log.debug('error is', error);

            messenger.error(error);
          }
        }
      };
    },
    handle : function (err) {
      messenger.danger(JSON.stringify(err), 7000);
    }
  };
}]);
