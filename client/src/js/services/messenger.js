angular.module('bhima.services')
.service('messenger', [
  '$timeout',
  '$sce',
  '$translate',
  'errorCodes',
  function ($timeout, $sce, $translate, errorCodes) {
    var self = this;
    self.messages = [];
    var indicies = {};

    self.push = function (data, timer) {
      var id = Date.now();
      data.id = id;
      data.msg = $sce.trustAsHtml(data.msg); // allow html insertion
      self.messages.push(data);
      indicies[id] = $timeout(function () {
        var index, i = self.messages.length;

        while (i--) {
          if (self.messages[i].id === id) {
            self.messages.splice(i, 1);
            break;
          }
        }

      }, timer || 3000);
    };

    (function () {
      ['info', 'warning', 'danger', 'success']
      .forEach(function (type) {
        self[type] = function (message, timer) {
          self.push({type: type, msg: message }, timer);
        };
      });
    })();

    self.close = function (idx) {
      // cancel timeout and splice out
      $timeout.cancel(indicies[idx]);
      self.messages.splice(idx, 1);
    };

    // Future API
    // A blocking modal
    self.block = function (message, callback, errback) { };

    var unknown_msg = "An unanticipated error occured.";
    // Appropriate error formatting
    self.error = function (code, timer) {
      var err = errorCodes[code];
      // FIXME : translate doesn't work
      self.push({ title : 'ERROR: ' + err.title , msg : err.description, type: 'danger'}, timer || 5000);
    };
  }
]);
