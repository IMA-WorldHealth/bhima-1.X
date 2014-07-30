var q = require('q');

module.exports = function(db, parser, journal, uuid) {
  'use strict';

  //TODO Rollback logic can be implemented by sharing a transaction instance
  //(db.requestTransactionConnection) across multiple modules: generic top level
  //rollback.
  function execute(data, userId, callback) {
    writeMainConsumption(data.main_consumptions)
    .then(writeServiceConsumption(data.service_consumptions))
    .then(writeToJournal(data.main_consumptions[0].document_id, userId, data.details))
    .then(function(res){
      console.log('c fait');
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
