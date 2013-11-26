angular.module('kpk.controllers').controller('priceListController', function ($scope, $q, connect, appstate) {
  var pln, pl, grp, inv, eid, models, validate, stores, dirty, flags, dependencies, changes;

  // FIXME: Eventually move away form this method of getting enterprise id
  // so that we can refresh when the enterprise changes
  eid = appstate.get('enterprise').id;

  // price list names
  pln = {
    tables: { 'price_list_name' : { columns :  ["id", "name"] }},
    where : ["price_list_name.enterprise_id="+eid]
  };

  // inventory
  inv = {
    tables : { 'inventory' : { columns: ["id", "code", "text"] }} 
  };
  
  // inventory group
  grp = { 
    tables : { 'inv_group' : { columns: ["id", "name", "symbol"] }}
  };

  // price list 
  pl = {
    tables: { 'price_list' : { columns : ["id", "list_id", "inventory_id", "price", "discount", "note"] }},
    where : []
  };

  // initialize models
  models       = $scope.models = {};
  flags        = $scope.flags  = {};
  dirty        = $scope.dirty  = {};
  validate     = $scope.validate = {};
  flags.edit   = {};
  flags.errors = {};
  stores       = {};
  dependencies = ["plnames", "inv", "grp"];

  $q.all([
    connect.req(pln),
    connect.req(inv),
    connect.req(grp)
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
  $scope.addList = function () {
    var id, list;
    id = stores.plnames.generateid();
    list = {id: id};
    stores.plnames.put(list);
    // after creating, immediately edit
    $scope.editList(id);
  };

  // validate and save
  $scope.saveList = function () {
    var id = flags.edit.list;
    var list = stores.plnames.get(id);
    if (!validate.list(list)) stores.plnames.delete(id);
    else {
      list.enterprise_id = eid;
      connect.basicPut('price_list_name', [list]);
    }
    flags.edit.list = Infinity;
  };

  // edit a list
  $scope.editList = function (id) {
     flags.edit.list = id;
  };

  // load a specific price list
  $scope.loadList = function (id) {
    if (flags.edit.list === Infinity) {
      console.log("loading list");
      pl.where = ["price_list.list_id=" + id];
      connect.req(pl).then(function (res) {
        models.pl = res.data;
        stores.pl = res;
      });
      flags.list = id;
      flags.add = true;
    }
  };

  // Item controls
  
  // remove an item from the price list
  $scope.removeItem = function (id) {
    flags.add = true;
    stores.pl.delete(id);
  };

  // add an item to the price list
  $scope.addItem = function () {
    var id = stores.pl.generateid();
    stores.pl.put({id: id, list_id: flags.list});
    $scope.editItem(id);
  };
 
  // edit an item in the price list 
  $scope.editItem = function (id) {
    flags.edit.item = id;
    flags.add = false;
  };

  // label the inventory properly
  $scope.label = function (invid) {
    // sometimes it is not defined
    var item = invid ? stores.inv.get(invid) : {};
    return (item && item.text) ? item.text : "";
  };

  // validate and exit editing
  $scope.saveEdit = function () {
    var item = stores.pl.get(flags.edit.item);
    if (validate.item(item)) { 
      flags.edit.item = Infinity; 
      flags.add = true;
    }
  };

  // filter controls
  $scope.filter = function (id) {
    flags.filter = id >= 0 ? stores.grp.get(id).symbol : "";
    refreshInventory();
  };

  function refreshInventory () {
    var inv = { tables : { 'inventory' : { columns: ["id", "code", "text"] }}};
    if (flags.filter) {
      inv.where = ["inventory.group_id="+flags.filter];
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

  $scope.save = function () {
    // TODO: do all this with connect
    // stores
    function clean (obj) {
      var cln = {};
      for (var k in obj) {
        if (k !== "hashkey") {
          cln[k] = obj[k]; 
        } 
      }
      return cln;
    }

    var data = models.pl.map(clean);
    console.log("saving:", data);
    connect.basicPut('price_list', data);
  };

  $scope.erase = function () {
    // TODO: add a user warning before doing this..
    models.pl.forEach(function (i) {
      stores.pl.delete(i.id); 
    });
  };

});