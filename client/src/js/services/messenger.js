angular.module('bhima.services')
.service('messenger', [
  '$timeout',
  '$sce',
  function ($timeout, $sce) {

    // TODO : all fns should use enqueue() to add messages to
    // queue.  There also should be no way to set a time limit.
    // You can only NO LIMIT to allow messages to persist.

    var self = this,
      messages = self.messages = [],
      indicies = {};

    function enqueue(data, timer) {
      var id = Date.now();
      data.id = id;
      data.msg = $sce.trustAsHtml(data.msg); // allow html insertion
      messages.push(data);
      indicies[id] = $timeout(function () {
        var i = messages.length;

        while (i--) {
          if (messages[i].id === id) {
            messages.splice(i, 1);
            break;
          }
        }

      }, timer || 3000);
    }

    (function init() {
      ['info', 'warning', 'danger']
      .forEach(function (type) {
        self[type] = function (message, timer) {
          enqueue({type: type, msg: message }, timer);
        };
      });
    })();

    self.close = function close(idx) {
      // cancel timeout and splice out
      $timeout.cancel(indicies[idx]);
      messages.splice(idx, 1);
    };

    // Appropriate error formatting
    self.error = function error(err) {
      angular.extend(err, { type : 'error', closable : true, error : true });
      messages.push(err);
    };

    self.primary  = function primary(data) {
      angular.extend(data, { type : 'primary', closable : true });
      messages.push(data);
    };

    self.warn = function warn(data) {
      angular.extend(data, { type : 'warning', closable : true });
      messages.push(data);
    };

    self.success = function success(data) {
      if (typeof data === 'object') {
        angular.extend(data, { type : 'success', closable : true});
      } else {
        data = {
          type : 'success',
          closable : true,
          namespace : 'MESSENGER',
          description : data
        };
      }

      messages.push(data);
    };
  }
]);
