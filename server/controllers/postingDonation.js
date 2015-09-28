var journal = require('./../controllers/journal');

var q = require('q');

module.exports = function() {
  'use strict';

  function execute(data, userId, callback) {
    return writeToJournal(data.movement.document_id, userId, data)
    .then(function(){ 
      var res = {};
      res.docId = data.movement.document_id;    
      callback(null, res);
    })
    .catch(function (err) {
      callback(err, null);
    });    
  }

  // FIXME -- make this much clearer
  function writeToJournal (id, userId, data) {
    var deferred = q.defer();
    journal.request('donation', id, userId, function (error, result) {
      if (error) {
        return deferred.reject(error);
      }
      return deferred.resolve(result);
    }, undefined, data);
    return deferred.promise;
  }
  return { execute : execute };
};
