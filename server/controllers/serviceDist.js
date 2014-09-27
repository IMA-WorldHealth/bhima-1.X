var q = require('q');

module.exports = function(db, parser, journal, uuid) {
  'use strict';

  function execute(data, userId, callback) {
    return writeMainConsumption(data.main_consumptions)
      .then(function () {
        return writeServiceConsumption(data.service_consumptions);
      })
      .then(function () {
        return writeToJournal(data.main_consumptions[0].document_id, userId, data.details)
      })
      .then(function(){ 
        var res = {};
        res.docId = data.main_consumptions[0].document_id;    
        callback(null, res);
      })
      .catch(function (err) {
        callback(err, null);
      });
  }

  function writeMainConsumption (main_consumptions) {
    return db.exec(generate ('consumption', main_consumptions));
  }

  function writeServiceConsumption (service_consumptions) {
    return db.exec(generate ('consumption_service', service_consumptions));
  }

  function writeToJournal (document_id, userId, details) {
    var deferred = q.defer();
    journal.request('distribution_service', document_id, userId, function (error, result) {
      if (error) {
        return deferred.reject(error);
      }
      return deferred.resolve(result);
    }, undefined, details);
    return deferred.promise;
  }

  function generate (table, data) {
    return parser.insert(table, data);
  }
  return { execute : execute };
};
