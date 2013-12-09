angular.module('kpk.controllers')
.controller('priceListController', function ($scope, $q, connect, appstate) {
  var imports = {},
      models       = $scope.models = {},
      flags        = $scope.flags  = {},
      dirty        = $scope.dirty  = {},
      validate     = $scope.validate = {},
      dependencies = ["plnames", "inv", "grp"],
      stores       = {};
  flags.edit   = {};
  flags.errors = {};

  // FIXME: Eventually move away form this method of getting enterprise id
  // so that we can refresh when the enterprise changes
  imports.enterprise_id = appstate.get('enterprise').id;
  imports.pln = {
    tables: { 'price_list_name' : { columns :  ["id", "name"] }},
    where : ["price_list_name.enterprise_id="+imports.enterprise_id]
  };
  imports.inv = {tables : { 'inventory' : { columns: ["id", "code", "text"] }}};
  imports.grp = {tables : { 'inv_group' : { columns: ["id", "name", "symbol"] }}};
  imports.pl = {tables: { 'price_list' : { columns : ["id", "list_id", "inventory_id", "price", "discount", "note"] }}};

  // initialize models

  $q.all([
    connect.req(imports.pln),
    connect.req(imports.inv),
    connect.req(imports.grp)
  ]).then(function (arr) {
    // load dependencies
    for (var i = arr.length - 1; i >= 0; i--) {
      models[dependencies[i]] = arr[i].data;
      stores[dependencies[i]] = arr[i];
    }
    flags.edit.list = Infinity;
  });

  // List controls

  // create a new price list
  function addList () {
    var id, list;
    id = stores.plnames.generateid();
    list = {id: id};
    stores.plnames.post(list);
    // after creating, immediately edit
    $scope.editList(id);
  }

  function removeList () {
    var bool = confirm("Are you sure you want to do this?  It will delete the entire price list and subitems!");
    if (!bool) return;
    var id = flags.list;
    models.pl.forEach(function(item) {
      $scope.removeItem(item.id);
    });
    stores.plnames.remove(id);
    connect.basicDelete('price_list_name', id);
  }

  // validate and save
  function saveList () {
    var id = flags.edit.list;
    var list = stores.plnames.get(id);
    if (!validate.list(list)) stores.plnames.remove(id);
    else {
      list.enterprise_id = imports.enterprise_id;
      connect.basicPut('price_list_name', [list]);
    }
    flags.edit.list = Infinity;
  }

  // edit a list
  function editList (id) {
     flags.edit.list = id;
  }

  // load a specific price list
  function loadList (id) {
    if (flags.edit.list === Infinity) {
      imports.pl.where = ["price_list.list_id=" + id];
      connect.req(imports.pl).then(function (res) {
        models.pl = res.data;
        stores.pl = res;
      });
      flags.list = id;
      flags.add = true;
    }
  }

  // Item controls
  
  // remove an item from the price list
  function removeItem (id) {
    flags.add = true;
    stores.pl.remove(id);
    connect.basicDelete("price_list", id);
  }

  // add an item to the price list
  function addItem () {
    var id = stores.pl.generateid();
    stores.pl.post({id: id, list_id: flags.list});
    $scope.editItem(id);
  }
 
  // edit an item in the price list 
  function editItem (id) {
    flags.edit.item = id;
    flags.add = false;
  }

  // validate and exit editing
  function saveEdit () {
    var item = stores.pl.get(flags.edit.item);
    if (validate.item(item)) { 
      flags.edit.item = Infinity; 
      flags.add = true;
    }
  }

  // filter controls
  function filter (id) {
    flags.filter = id >= 0 ? stores.grp.get(id).symbol : "";
    refreshInventory();
  }

  // label the inventory properly
  function label (invid) {
    // sometimes it is not defined
    var item = invid ? stores.inv.get(invid) : {};
    return (item && item.text) ? item.text : "";
  }

  function refreshInventory () {
    var inv = { tables : { 'inventory' : { columns: ["id", "code", "text"] }}};
    if (flags.filter) {
      inv.where = ["inventory.group_id=" + flags.filter];
    }
    connect.req(inv).then(function (res) {
      models.inv = res.data;
      stores.inv = res;
    });
  }

  // validation

  // validate item
  validate.item = function (item) {
    // an item must have ether a price or a 
    // discount, but not both
    var bool = !!item.id && !!item.inventory_id && ((!!item.price || !!item.discount) && !(!!item.price && !!item.discount));
    return bool;
  };

  validate.list = function (list) {
    // a list must have all fields filled out
    var bool = !!list.id && !!list.name;
    return bool;
  };

  // form controls

  function save () {
    models.pl.map(function (item) { return connect.clean(item); });
    // TODO/FIXME: There is currently no way to do batch inserts.
    // So we are resorted to doing this.
    models.pl.forEach(function (item) {
      connect.basicPut('price_list', [item]);
    });
  }

  function erase () {
    var bool = confirm("Are you sure you want to do this?  It will clear the entire price list!");
    if (bool) {
      models.pl.forEach(function (item) {
        stores.pl.remove(item.id); 
      });
    }
  }

  // expose to view
  $scope.saveList = saveList;
  $scope.addList= addList;
  $scope.editList= editList;
  $scope.loadList = loadList;
  $scope.removeList = removeList;

  $scope.addItem = addItem;
  $scope.removeItem = removeItem;
  $scope.editItem = editItem;
  $scope.saveEdit = saveEdit;

  $scope.filter = filter;
  $scope.label = label;
  $scope.erase = erase;
  $scope.save = save;

});
