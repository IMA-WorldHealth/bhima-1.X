var p = require('../lib/database/parser')();

exports.testSelect = function (test) {
  var query, expected, msg;
  
  query = { tables : { 'account' : { columns : ['id', 'number'] }}};

  expected = 'SELECT `account`.`id`, `account`.`number` ' + 
    'FROM `account` ' + 
    'WHERE 1;';

  msg = 'Simple select condition failed.';
  
  test.equal(p.select(query), expected, msg); 

  query = {
    tables : {
      'unit' : { columns :  ['id', 'url'] },
      'permission' : { columns :  ['id_user'] }
    },
    join: ['unit.id=permission.id_unit']
  };

  expected = 'SELECT `unit`.`id`, `unit`.`url`, `permission`.`id_user` ' +
    'FROM `unit` ' +
    'JOIN `permission` ON `unit`.`id`=`permission`.`id_unit` ' +
    'WHERE 1;';

  msg = 'two-way join condition failed';

  test.equal(p.select(query), expected, msg);

  query = {
    tables : { 'enterprise' : { columns : ['id', 'currency_id']}},
    where : ['enterprise.id<100']
  };

  expected = 'SELECT `enterprise`.`id`, `enterprise`.`currency_id` ' + 
    'FROM `enterprise` ' +
    'WHERE `enterprise`.`id`<100;';

  msg = 'simple where condition failed';

  test.equal(p.select(query), expected, msg);

  test.done();

};

exports.testUpdate = function (test) {
  var query, expected, msg;

  query = p.update('unit', {id: 1, url : 'some/url/content', parent : 23} , 'id');
  expected = 'UPDATE `unit` SET `url`="some/url/content", `parent`=23 WHERE `id`=1;';
  msg = 'update failed';

  test.equal(query, expected, msg);


  test.done();

};

exports.testDelete = function (test) {
  var query, expected, msg;

  query = p.delete('posting_journal', 'id', 1);
  expected = 'DELETE FROM `posting_journal` WHERE `id`=1;';
  msg = 'simple delete failed';

  test.equal(query, expected, msg);

  test.done();
};

exports.testInsert = function (test) {
  var query, expected, msg;

  query = p.insert('creditor_group', [{ id: 1, name: "IMCK Medical"}]);
  expected = 'INSERT INTO `creditor_group` (`id`, `name`) VALUES (1, "IMCK Medical");'; 
  msg = 'simple insert failed';

  test.equal(query, expected, msg);

  query = p.insert('permission', [{id_user: 1, id_unit: 2}, {id_user: 1, id_unit: 4}]);
  expected = 'INSERT INTO `permission` (`id_user`, `id_unit`) VALUES (1, 2), (1, 4);';
  msg = 'multi item insert failed';

  test.equal(query, expected, msg);

  test.done();
};
