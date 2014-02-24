var parser = require('../lib/database/parser')();

var _select = {
  simple : {
    query : {
      'tables' : {
        'account' : {
          'columns' : [ 'id', 'number']
        }
      }
    },
    fail : 'Parser.js fails to compose simple SELECT queries',
    result : 'SELECT `account`.`id`, `account`.`number` FROM `account` WHERE 1;'
  },

  join : {
    query : {
      tables : {
        'permission' : {
          columns : ['id', 'id_unit', 'id_user']
        },
        'unit' : {
          columns : ['name', 'key', 'label']
        },
        'user' : {
          columns : ['username', 'email']
        }
      },
      join : ['permission.id_unit=unit.id', 'permission.id_user=user.id']
    },
    fail : 'Parser.js fails to compose 3-way JOIN queries',
    result :
      'SELECT `permission`.`id`, `permission`.`id_unit`, `permission`.`id_user`, ' +
        '`unit`.`name`, `unit`.`key`, `unit`.`label`, `user`.`username`, ' +
        '`user`.`email` ' +
      'FROM `permission` JOIN `unit` JOIN `user` ON ' +
        '`permission`.`id_unit`=`unit`.`id` AND ' +
        '`permission`.`id_user`=`user`.`id` WHERE 1;'
  },

  where : {
    query : {
      tables : {
        'account' : {
          columns : ['id', 'account_number', 'account_txt', 'locked']
        }
      },
      where : ['account.locked<>0', 'AND', 'account.account_number>=100']
    },
    fail: 'Parser.js fails to compose simple WHERE conditions',
    result :
      'SELECT `account`.`id`, `account`.`account_number`, `account`.`account_txt`, ' +
        '`account`.`locked` ' +
      'FROM `account` ' +
      'WHERE `account`.`locked`<>0 AND `account`.`account_number`>=100;'
  },

  where_complex : {
    query : {
      tables : {
        'enterprise' : {
          columns : ['id', 'name', 'location_id', 'phone', 'email', 'account_group_id']
        },
        'account_group' : {
          columns : ['account_number', 'ordering']
        }
      },
      where : ['enterprise.id=1', 'AND', ['account_group.account_number<100', 'OR',
        'account_group.account_number>150']],
      join : ['enterprise.account_group_id=account_group.id']
    },
    fail : 'Parser.js fails to compose complex (joined & nested) WHERE conditions',
    result :
      'SELECT `enterprise`.`id`, `enterprise`.`name`, `enterprise`.`location_id`, ' +
        '`enterprise`.`phone`, `enterprise`.`email`, `enterprise`.`account_group_id`, ' +
        '`account_group`.`account_number`, `account_group`.`ordering` ' +
      'FROM `enterprise` JOIN `account_group` ON ' +
        '`enterprise`.`account_group_id`=`account_group`.`id` ' +
      'WHERE `enterprise`.`id`=1 AND (`account_group`.`account_number`<100 OR ' +
        '`account_group`.`account_number`>150);'
  },

  limit: {
    query : {
      tables : {
        'debtor' : {
          columns : ['id', 'name', 'location_id', 'group_id']
        }
      },
      limit : 30
    },
    fail : 'Parser.js fails to compose simple LIMIT requests',
    result :
      'SELECT `debtor`.`id`, `debtor`.`name`, `debtor`.`location_id`, ' +
        '`debtor`.`group_id` ' +
      'FROM `debtor` ' +
      'WHERE 1 ' +
      'LIMIT 30;'
  },

  orderby : {
    query : {
      tables : {
        'creditor' : {
          columns : ['id', 'name', 'group_id']
        }
      },
      orderby: ['creditor.group_id']
    },
    fail : 'Parser.js fails to compose simple ORDER BY requests',
    result :
      'SELECT `creditor`.`id`, `creditor`.`name`, `creditor`.`group_id` ' +
      'FROM `creditor` ' +
      'WHERE 1 ' +
      'ORDER BY `creditor`.`group_id`;'
  },

  combination : {
    query : {
      tables : {
        'enterprise' : {
          columns : ['id', 'name', 'location_id', 'account_group_id']
        },
        'account_group' : {
          columns : ['account_number', 'ordering']
        }
      },
      where : ['enterprise.id=1', 'AND', ['account_group.account_number<100', 'OR', 'account_group.account_number>=150']],
      join : ['enterprise.account_group_id=account_group.id'],
      orderby : ['account_group.account_number'],
      limit: 5
    },
    fail : 'Parser.js fails to properly compose a maximum complexity query',
    result :
      'SELECT `enterprise`.`id`, `enterprise`.`name`, `enterprise`.`location_id`, ' +
        '`enterprise`.`account_group_id`, `account_group`.`account_number`, ' +
        '`account_group`.`ordering` ' +
      'FROM `enterprise` JOIN `account_group` ON ' +
        '`enterprise`.`account_group_id`=`account_group`.`id` ' +
      'WHERE `enterprise`.`id`=1 AND (`account_group`.`account_number`<100 OR ' +
        '`account_group`.`account_number`>150) ' +
      'ORDER BY `account_group`.`account_number` ' +
      'LIMIT 5;'
  }

};

var _update = {

  simple : {
    table : 'unit',
    data : { id : 1, url : '/some/url/content/', parent: 23 },
    key : 'id',
    fail : 'Parser.js cannot compose simple update queries',
    result :
      'UPDATE `unit` SET `url`="/some/url/content/", `parent`=23 ' +
      'WHERE `id`=1;'
  },

  // TODO : this test is a work in progress.
  multi : {
    table : 'unit',
    data : [
      { id : 2, name : 'modified'},
      { id : 3, name : 'another'}
    ],
    key : 'id',
    fail : 'Parser.js cannot compose multi update queries',
    result :
      'UPDATE `unit` set `name`="modified" WHERE `id`=2;'
  }
};

var _insert = {
  simple : {
    table: 'user',
    data : { username : 'axelroad', email : 'axel@gmail.com' },
    fail : 'Parser.js cannot compose simple insert queries',
    result :
      'INSERT INTO `user` (`username`, `email`) VALUES ' +
        '("axelroad", "axel@gmail.com");'
  },

  multi : {
    table : 'inventory',
    data : [
      { code : 'CHGRAN', price : 100, text : 'Chirgerie' },
      { code : 'EXPYAN', price : 20, text : 'Extra Pain'}
    ],
    fail : 'Parser.js cannot compose multi insert queries',
    result :
      'INSERT INTO `inventory` (`code`, `price`, `text`) VALUES ' +
        '("CHGRAN", 100, "Chirgerie"), ' +
        '("EXPYAN", 20, "Extra Pain");'
  }
};

var _delete = {
  simple : {
    table : 'account',
    key : 'id',
    value : 3,
    fail: 'Parser.js cannot compose simple delete queries',
    result:
      'DELETE FROM `account` WHERE `id`=3;'
  },

  multi : {
    table : 'account',
    key : 'id',
    value : [1,2,3,4],
    fail : 'Parser.js cannot compose mutli delete queries',
    result :
      'DELETE FROM `account` WHERE `id` in (1, 2, 3, 4);'
  }

};

exports.testSelect = function (test) {

  for (var _key in _select) {
    var _test = _select[_key];
    test.equal(parser.select(_test.query), _test.result, _test.fail);
    console.log('_key:', _key);
  }

  test.done();

};

exports.testUpdate = function (test) {

  for (var _key in _update) {
    var _test = _update[_key];
    test.equal(parser.update(_test.table, [_test.data], [_test.key]), _test.result, _test.fail);
  }

  test.done();

};

exports.testDelete = function (test) {

  for (var _key in _delete) {
    var _test = _delete[_key];
    test.equal(parser.delete(_test.table, _test.key, _test.value), _test.result, _test.fail);
  }

  test.done();
};

exports.testInsert = function (test) {

  for (var _key in _insert) {
    var _test = _insert[_key];
    test.equal(parser.insert(_test.table, _test.data), _test.result, _test.fail);
  }

  test.done();
};
