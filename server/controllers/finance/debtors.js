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
        res.status(404).send();
        return;
      } else { 
        
        debtorDetail = result[0];
        res.status(200).json(debtorDetail);
      }
    })
    .catch(next)
    .done();
}

function listGroups(req, res, next) { 
  var listDebtorGroupsQuery;

  listDebtorGroupsQuery = 
    'SELECT uuid, name, account_id FROM debitor_group';

  db.exec(listDebtorGroupsQuery)
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
