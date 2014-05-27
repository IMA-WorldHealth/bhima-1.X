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

function CustomError (code, namespace, message) {
  var args, err = Error.call(this, message);
  err.code = code;
  err.namespace = namespace;
  args = Array.prototype.slice.call(arguments);
  err.params = args.slice(3);
  return err;
}

module.exports = function generator () {
  return {
    namespace : function (module) {
      return function () {
        var code = arguments[0],
          prefix = '[' + (module ? module + ':' : '') + code + '] ',
          template = arguments[1],
          templateArgs = arguments,
          message;

        message = prefix + template.replace(/\{\d+\}/g, function (match) {
          var index = +match.slice(1, -1), arg;

          if (index + 2 < templateArgs.length) {
            arg = templateArgs[index + 2];
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

        // FIXME: this can be re-written as a custom error object
        return new CustomError(code, module, message);
      };
    },
    middleware : function (err, req, res, next) {
      // TODO : add logger capabilities here
      var httpCode = err.httpCode || 500;
      console.log('[ERROR] ', err);
      res.send(httpCode, err);
    }
  };
};
