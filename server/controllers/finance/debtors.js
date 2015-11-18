// TODO Patients currently responsible for setting debtor (one small line) - should this be delegated here?
// TODO Create Debtor Group
var db = require('../../lib/db'),
    guid = require('../../lib/guid');

exports.groupDetails = details;
exports.listGroups = listGroups;

function details(req, res, next) { 
  var debtorDetailsQuery;
  var uuid = req.params.uuid;

  debtorDetailsQuery = 
    'SELECT uuid, name, account_id, location_id, phone, email, note, locked ' + 
      'max_credit, is_convention, price_list_uuid ' + 
    'FROM debitor_group ' + 
    'WHERE uuid = ?';

  db.exec(debtorDetailsQuery, [uuid])
    .then(function (result) { 
      var debtorDetail;

      if (isEmpty(result)) { 
        res.status(404).json({
          code : 'ERR_NOT_FOUND', 
          reason : 'No debtor groups found under the id ' + uuid
        });
        return;
      } else { 
        
        debtorDetail = result[0];
        res.status(200).json(debtorDetail);
      }
    })
    .catch(next)
    .done();
}

// TODO ? parameter to request all (including locked) groups
function listGroups(req, res, next) { 
  var listDebtorGroupsQuery, filterLockedCondition;
  var query;

  listDebtorGroupsQuery = 
    'SELECT uuid, name, locked, account_id FROM debitor_group';
  
  filterLockedCondition = 
    'WHERE locked = 0';
  
  // TODO ? parameter to request all (including locked) groups
  query = listDebtorGroupsQuery.concat(' ', filterLockedCondition);

  db.exec(query)
    .then(function (result) { 
      var debtors = result;

      res.status(200).json(result);
    })
    .catch(next)
    .done();
}

function isEmpty(array) { 
  return array.length === 0;
}
