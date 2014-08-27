var q = require('q');

module.exports = function(db, parser, journal, uuid) {
  'use strict';

  function execute(data, userId, callback) {

    console.log('voici les data : ', data);
    return writeMainConsumption(data.main_consumptions)
      .then(function () {
        return writeLossConsumption(data.loss_consumptions);
      })
      .then(function () {
        return writeToJournal(data.main_consumptions[0].document_id, userId, data.details)
      })
      .then(function(){ 
        var res = {};
        res.docId = data.main_consumptions[0].document_id;    
        console.log('res :::', res);
        callback(null, res);
      })
      .catch(function (err) {
        callback(err, null);
      });
  }

  function writeMainConsumption (main_consumptions) {
    return db.exec(generate ('consumption', main_consumptions));
  }

  function writeLossConsumption (loss_consumptions) {
    return db.exec(generate ('consumption_loss', loss_consumptions));
  }

  function writeToJournal (document_id, userId, details) {
    var deferred = q.defer();
    journal.request('consumption_loss', document_id, userId, function (error, result) {
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
