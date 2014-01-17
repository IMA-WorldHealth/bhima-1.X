angular.module('kpk.controllers')
.controller('priceListController', function ($scope, $q, connect, messenger, appstate) {
  // This module is responsible for creating price lists.
  // FIXME: There is an error with editing old price lists.  Need to 
  // make a facility for that and fix the errors using connect.basicPost

  'use strict';

  var imports = {},
      models       = $scope.models = {},
      flags        = $scope.flags  = {},
      dirty        = $scope.dirty  = {},
      validate     = $scope.validate = {},
      dependencies = ["price_list_name", "inventory", "inv_group"],
      stores       = {};
  flags.edit   = {};
  flags.errors = {};

  imports.enterprise_id = appstate.get('enterprise').id;
  imports.price_list_name = {
    tables: { 'price_list_name' : { columns :  ["id", "name"] }},
    where : ["price_list_name.enterprise_id="+imports.enterprise_id]
  };
  imports.inventory = {tables : { 'inventory' : { columns: ["id", "code", "text", "group_id"] }}};
  imports.inv_group = {tables : { 'inv_group' : { columns: ["id", "name", "symbol"] }}};
  imports.price_list = {tables: { 'price_list' : { columns : ["id", "list_id", "inventory_id", "price", "discount", "note"] }}};


  function run () {
    // initialize models

    $q.all([
      connect.req(imports.price_list_name),
      connect.req(imports.inventory),
      connect.req(imports.inv_group)
    ]).then(function (arr) {
      // load dependencies
      for (var i = arr.length - 1; i >= 0; i--) {
        models[dependencies[i]] = arr[i].data;
        stores[dependencies[i]] = arr[i];
      }
      flags.edit.list = Infinity;
    });
  }

  // List controls

  // create a new price list
  function addList () {
    var id, list;
    id = stores.price_list_name.generateid();
    list = {id: id};
    stores.price_list_name.post(list);
    // after creating, immediately edit
    $scope.editList(id);
  }

  function removeList () {
    var bool = confirm("Are you sure you want to do this?  It will delete the entire price list and subitems!");
    if (!bool) return;
    var id = flags.list;
    models.price_list.forEach(function(item) {
      $scope.removeItem(item.id);
    });
    stores.price_list_name.remove(id);
    connect.basicDelete('price_list_name', id);
  }

  // validate and save
  function saveList () {
    var id = flags.edit.list;
    var list = stores.price_list_name.get(id);
    if (!validate.list(list)) stores.price_list_name.remove(id);
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
      imports.price_list.where = ["price_list.list_id=" + id];
      connect.req(imports.price_list).then(function (res) {
        stores.price_list = res;
        $scope.models.price_list = res.data;
      });
      flags.list = id;
      flags.add = true;
    }
  }

  // Item controls
  
  // remove an item from the price list
  function removeItem (id) {
    flags.add = true;
    stores.price_list.remove(id);
    connect.basicDelete("price_list", id);
  }

  // add an item to the price list
  function addItem () {
    var id = stores.price_list.generateid();
    stores.price_list.post({id: id, list_id: flags.list});
    $scope.editItem(id);
  }
 
  // edit an item in the price list 
  function editItem (id) {
    flags.edit.item = id;
    flags.add = false;
  }

  // validate and exit editing
  function saveEdit () {
    var item = stores.price_list.get(flags.edit.item);
    if (validate.item(item)) { 
      flags.edit.item = Infinity; 
      flags.add = true;
    }
  }

  // label the inventory properly
  function label (inventory_id) {
    // sometimes it is not defined
    var item = inventory_id ? stores.inventory.get(inventory_id) : {};
    return (item && item.text) ? item.text : "";
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
    models.price_list.map(function (item) { return connect.clean(item); });
    // TODO/FIXME: There is currently no way to do batch inserts.
    // So we are resorted to doing this.
    models.price_list.forEach(function (item) {
      connect.basicPut('price_list', [item]);
    });
  }

  function erase () {
    var bool = confirm("Are you sure you want to do this?  It will clear the entire price list!");
    if (bool) {
      models.price_list.forEach(function (item) {
        stores.price_list.remove(item.id); 
      });
    }
  }

  function showFilter (id) {
    return stores.inv_group && stores.inv_group.get(id) ? stores.inv_group.get(id).symbol : "";
  }

  run();

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
  $scope.showFilter = showFilter;

  $scope.label = label;
  $scope.erase = erase;
  $scope.save = save;

});
